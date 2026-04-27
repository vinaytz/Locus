import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.module';
import { REDIS_CLIENT } from '../redis/redis.module';
import { LEAGUE } from '../gamification/rewards.constants';

const zsetKey = (groupId: string) => `leaderboard:${groupId}`;

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {}

  /**
   * Ensures a participant row for the user. If they have no group, place
   * them in an open WAITING group at their league tier (or create one).
   * Spec §3.
   */
  async ensurePlacement(userId: string) {
    const stats = await this.prisma.userStats.findUnique({ where: { userId } });
    if (!stats) throw new NotFoundException('User stats missing');
    const tier = clampTier(stats.currentLeagueIndex);

    const existing = await this.prisma.leaderboardParticipant.findFirst({
      where: { userId, group: { state: { in: ['WAITING', 'ACTIVE'] } } },
      include: { group: true },
    });
    if (existing) return existing;

    return this.prisma.$transaction(async (tx) => {
      let group = await tx.leaderboardGroup.findFirst({
        where: { leagueTier: tier, state: 'WAITING', filledCount: { lt: LEAGUE.GROUP_SIZE } },
        orderBy: { createdAt: 'asc' },
      });
      if (!group) {
        group = await tx.leaderboardGroup.create({
          data: { leagueTier: tier, state: 'WAITING' },
        });
      }
      const participant = await tx.leaderboardParticipant.create({
        data: { groupId: group.id, userId, seasonXp: 0 },
        include: { group: true },
      });
      const newCount = group.filledCount + 1;
      const shouldActivate = newCount >= LEAGUE.GROUP_SIZE;
      const startedAt = shouldActivate ? new Date() : null;
      const endsAt = shouldActivate
        ? new Date(Date.now() + LEAGUE.SEASON_DAYS * 86_400_000)
        : null;
      const updated = await tx.leaderboardGroup.update({
        where: { id: group.id },
        data: {
          filledCount: newCount,
          state: shouldActivate ? 'ACTIVE' : 'WAITING',
          startedAt: shouldActivate ? startedAt : group.startedAt,
          endsAt: shouldActivate ? endsAt : group.endsAt,
        },
      });
      participant.group = updated;
      return participant;
    });
  }

  /**
   * Called whenever a user earns XP. The XP only counts toward the
   * leaderboard if their group is in ACTIVE state (spec §3.3).
   */
  async recordXp(userId: string, xp: number) {
    if (xp <= 0) return null;
    const participant = await this.ensurePlacement(userId);
    if (participant.group.state !== 'ACTIVE') return participant;

    const updated = await this.prisma.leaderboardParticipant.update({
      where: { id: participant.id },
      data: { seasonXp: { increment: xp }, lastXpAt: new Date() },
    });

    if (this.redis) {
      try {
        // ZINCRBY for O(log N) updates
        await this.redis.zincrby(zsetKey(participant.groupId), xp, userId);
      } catch (err: any) {
        this.logger.warn(`Redis ZINCRBY failed: ${err?.message ?? err}`);
      }
    }
    return updated;
  }

  /**
   * Returns the current group ranking and remaining time. Reads from Redis
   * when available, falls back to the relational table.
   */
  async getMyLeaderboard(userId: string) {
    const participant = await this.ensurePlacement(userId);
    const group = participant.group;

    let ranking: { userId: string; seasonXp: number; rank: number }[] = [];
    if (this.redis && group.state === 'ACTIVE') {
      try {
        const raw = await this.redis.zrevrange(zsetKey(group.id), 0, -1, 'WITHSCORES');
        ranking = parseZRange(raw);
      } catch (err: any) {
        this.logger.warn(`Redis ZRANGE failed, falling back to DB: ${err?.message ?? err}`);
      }
    }
    if (ranking.length === 0) {
      const rows = await this.prisma.leaderboardParticipant.findMany({
        where: { groupId: group.id },
        orderBy: [{ seasonXp: 'desc' }, { lastXpAt: 'asc' }, { joinedAt: 'asc' }],
      });
      ranking = rows.map((r, i) => ({ userId: r.userId, seasonXp: r.seasonXp, rank: i + 1 }));
    }

    // Hydrate display names for the response
    const users = await this.prisma.user.findMany({
      where: { id: { in: ranking.map((r) => r.userId) } },
      select: { id: true, displayName: true },
    });
    const nameMap = new Map(users.map((u) => [u.id, u.displayName]));

    return {
      group: {
        id: group.id,
        leagueTier: group.leagueTier,
        state: group.state,
        filledCount: group.filledCount,
        capacity: group.capacity,
        startedAt: group.startedAt,
        endsAt: group.endsAt,
        secondsRemaining:
          group.endsAt ? Math.max(0, Math.floor((group.endsAt.getTime() - Date.now()) / 1000)) : null,
      },
      me: { userId, seasonXp: participant.seasonXp },
      ranking: ranking.map((r) => ({ ...r, displayName: nameMap.get(r.userId) ?? 'Unknown' })),
    };
  }

  /**
   * Cron entry: close ACTIVE groups whose timers have elapsed and apply
   * promotion/demotion (spec §3.4).
   */
  async closeExpiredGroups() {
    const now = new Date();
    const expired = await this.prisma.leaderboardGroup.findMany({
      where: { state: 'ACTIVE', endsAt: { lte: now } },
    });

    for (const group of expired) {
      // Tie-break: higher XP first; if tied, earlier lastXpAt wins.
      const ranked = await this.prisma.leaderboardParticipant.findMany({
        where: { groupId: group.id },
        orderBy: [
          { seasonXp: 'desc' },
          { lastXpAt: 'asc' },
          { joinedAt: 'asc' },
        ],
      });

      await this.prisma.$transaction(async (tx) => {
        for (let i = 0; i < ranked.length; i++) {
          const p = ranked[i];
          const stats = await tx.userStats.findUnique({ where: { userId: p.userId } });
          if (!stats) continue;
          let newTier = stats.currentLeagueIndex;
          if (i < LEAGUE.PROMOTION_TOP) newTier = clampTier(newTier + 1);
          else if (i >= ranked.length - LEAGUE.DEMOTION_BOTTOM) newTier = clampTier(newTier - 1);
          if (newTier !== stats.currentLeagueIndex) {
            await tx.userStats.update({
              where: { userId: p.userId },
              data: { currentLeagueIndex: newTier },
            });
          }
        }
        await tx.leaderboardGroup.update({ where: { id: group.id }, data: { state: 'CLOSED' } });
      });

      if (this.redis) {
        try { await this.redis.del(zsetKey(group.id)); } catch { /* ignore */ }
      }
      this.logger.log(`Closed leaderboard group ${group.id} (tier ${group.leagueTier}, ${ranked.length} users)`);
    }
    return { closed: expired.length };
  }
}

function clampTier(t: number) {
  return Math.min(Math.max(t, LEAGUE.MIN_TIER), LEAGUE.MAX_TIER);
}

function parseZRange(raw: string[]): { userId: string; seasonXp: number; rank: number }[] {
  const out: { userId: string; seasonXp: number; rank: number }[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    out.push({ userId: raw[i], seasonXp: Number(raw[i + 1]), rank: i / 2 + 1 });
  }
  return out;
}
