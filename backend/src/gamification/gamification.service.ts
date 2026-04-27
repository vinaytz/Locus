import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { CompleteExerciseDto } from './gamification.dto';
import { HEARTS, REWARDS } from './rewards.constants';
import { computeStreak } from './streak.util';
import { applyHeartRegen, loseHearts } from './hearts.util';

export interface CompleteExerciseResult {
  attemptId: string;
  scorePct: number;
  isPerfect: boolean;
  xpAwarded: number;
  diamondsAwarded: number;
  unitCompleted: boolean;
  heartsLost: number;
  streak: { value: number; bonusAwarded: boolean; outcome: string };
  totals: {
    totalXp: number;
    diamonds: number;
    hearts: number;
    nextHeartAt: string | null;
    currentStreak: number;
  };
}

@Injectable()
export class GamificationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => LeaderboardService))
    private readonly leaderboard: LeaderboardService,
  ) {}

  async completeExercise(userId: string, dto: CompleteExerciseDto): Promise<CompleteExerciseResult> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: dto.exerciseId },
      include: { questions: { select: { id: true } }, unit: true },
    });
    if (!exercise) throw new NotFoundException('Exercise not found');
    if (dto.results.length !== exercise.questions.length) {
      throw new BadRequestException(
        `results length (${dto.results.length}) must equal question count (${exercise.questions.length})`,
      );
    }

    const correctCount = dto.results.filter(Boolean).length;
    const totalCount = exercise.questions.length;
    const scorePct = Math.round((correctCount / totalCount) * 100);
    const isPerfect = correctCount === totalCount;

    // --- Reward calculation (spec §1) ----------------------------------
    const baseXp = REWARDS.EXERCISE_BASE_XP;
    const perfectBonus = isPerfect ? REWARDS.PERFECT_SCORE_BONUS_XP : 0;
    const xpAwarded = baseXp + perfectBonus;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { stats: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const stats = user.stats ?? (await this.prisma.userStats.create({ data: { userId } }));
    const now = new Date();

    // Apply pending regen first so `liveHearts` reflects elapsed time.
    const regen = applyHeartRegen(stats.hearts, stats.lastHeartRefillAt, now);
    if (regen.hearts <= 0) {
      throw new BadRequestException('Out of hearts. Try again later or refill.');
    }
    const wrongs = totalCount - correctCount;
    const heartsLost = Math.min(wrongs, regen.hearts);
    const after = loseHearts(regen, wrongs, now);
    const newHearts = after.hearts;
    const newHeartAnchor = after.lastHeartRefillAt;

    const streak = computeStreak(
      stats.lastActivityDate,
      now,
      user.timezone || 'UTC',
      stats.currentStreak,
    );

    let diamondsAwarded = 0;
    let unitCompleted = false;
    let streakBonusAwarded = false;

    // ---- Unit completion check (after this attempt is recorded) -------
    // We compute it inside the transaction to be race-free.
    const result = await this.prisma.$transaction(async (tx) => {
      const attempt = await tx.exerciseAttempt.create({
        data: {
          userId,
          exerciseId: exercise.id,
          correctCount,
          totalCount,
          scorePct,
          xpAwarded,
          isPerfect,
          diamondsAwarded: 0, // patched below
        },
      });

      // Streak bonus: award only when the streak transitions to a new
      // multiple of 7 (CONTINUED or NEW). SAME_DAY never re-awards.
      if (
        (streak.outcome === 'CONTINUED' || streak.outcome === 'NEW') &&
        streak.newStreak > 0 &&
        streak.newStreak % 7 === 0
      ) {
        diamondsAwarded += REWARDS.STREAK_7_DIAMONDS;
        streakBonusAwarded = true;
        await tx.diamondLedger.create({
          data: {
            userId,
            delta: REWARDS.STREAK_7_DIAMONDS,
            reason: 'STREAK_7',
            refId: String(streak.newStreak),
          },
        });
      }

      // Unit completion bonus: every exercise in the unit has at least
      // one attempt by this user.
      const unitExercises = await tx.exercise.findMany({
        where: { unitId: exercise.unitId },
        select: { id: true },
      });
      const distinct = await tx.exerciseAttempt.findMany({
        where: { userId, exerciseId: { in: unitExercises.map((e) => e.id) } },
        select: { exerciseId: true },
        distinct: ['exerciseId'],
      });
      if (distinct.length === unitExercises.length) {
        // Has the user been awarded for this unit before?
        const prior = await tx.diamondLedger.findFirst({
          where: { userId, reason: 'UNIT_COMPLETION', refId: exercise.unitId },
        });
        if (!prior) {
          diamondsAwarded += REWARDS.UNIT_COMPLETION_DIAMONDS;
          unitCompleted = true;
          await tx.diamondLedger.create({
            data: {
              userId,
              delta: REWARDS.UNIT_COMPLETION_DIAMONDS,
              reason: 'UNIT_COMPLETION',
              refId: exercise.unitId,
            },
          });
        }
      }

      // Update aggregate stats
      const longest = Math.max(stats.longestStreak, streak.newStreak);
      const updated = await tx.userStats.update({
        where: { userId },
        data: {
          totalXp: { increment: xpAwarded },
          diamonds: { increment: diamondsAwarded },
          hearts: newHearts,
          lastHeartRefillAt: newHeartAnchor,
          currentStreak: streak.newStreak,
          longestStreak: longest,
          lastActivityDate: now,
        },
      });

      // Patch attempt row with diamond total for analytics
      await tx.exerciseAttempt.update({
        where: { id: attempt.id },
        data: { diamondsAwarded },
      });

      return { attemptId: attempt.id, updated };
    });

    // --- Leaderboard side-effect (Redis + Prisma) -----------------------
    // Done outside the SQLite txn; failures must not roll back rewards.
    try {
      await this.leaderboard.recordXp(userId, xpAwarded);
    } catch {
      // Logged inside the leaderboard service; swallow here.
    }

    return {
      attemptId: result.attemptId,
      scorePct,
      isPerfect,
      xpAwarded,
      diamondsAwarded,
      unitCompleted,
      heartsLost,
      streak: {
        value: result.updated.currentStreak,
        bonusAwarded: streakBonusAwarded,
        outcome: streak.outcome,
      },
      totals: {
        totalXp: result.updated.totalXp,
        diamonds: result.updated.diamonds,
        hearts: result.updated.hearts,
        nextHeartAt: after.nextHeartAt ? after.nextHeartAt.toISOString() : null,
        currentStreak: result.updated.currentStreak,
      },
    };
  }

  async refillHearts(userId: string, count: number) {
    if (!Number.isInteger(count) || count < 1 || count > HEARTS.MAX) {
      throw new BadRequestException(`count must be 1..${HEARTS.MAX}`);
    }
    const stats = await this.prisma.userStats.findUnique({ where: { userId } });
    if (!stats) throw new NotFoundException('Stats not initialised');
    const regen = applyHeartRegen(stats.hearts, stats.lastHeartRefillAt);
    if (regen.hearts >= HEARTS.MAX) {
      throw new BadRequestException('Hearts are already full.');
    }
    const missing = HEARTS.MAX - regen.hearts;
    const buy = Math.min(count, missing);
    const cost = buy * HEARTS.REFILL_COST_DIAMONDS;
    if (stats.diamonds < cost) {
      throw new BadRequestException(
        `Need ${cost} diamonds to refill ${buy} heart(s); you have ${stats.diamonds}.`,
      );
    }

    const newHearts = regen.hearts + buy;
    const newAnchor = newHearts >= HEARTS.MAX ? null : regen.lastHeartRefillAt;
    const nextHeartAt =
      newHearts >= HEARTS.MAX
        ? null
        : new Date((newAnchor as Date).getTime() + HEARTS.REGEN_INTERVAL_MS);

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.userStats.update({
        where: { userId },
        data: { hearts: newHearts, lastHeartRefillAt: newAnchor, diamonds: { decrement: cost } },
      });
      await tx.diamondLedger.create({
        data: { userId, delta: -cost, reason: 'HEART_REFILL', refId: String(buy) },
      });
      return u;
    });

    return {
      hearts: updated.hearts,
      diamonds: updated.diamonds,
      spent: cost,
      refilled: buy,
      nextHeartAt: nextHeartAt ? nextHeartAt.toISOString() : null,
    };
  }

  async getCompletedExerciseIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.exerciseAttempt.findMany({
      where: { userId },
      select: { exerciseId: true },
      distinct: ['exerciseId'],
    });
    return rows.map((r) => r.exerciseId);
  }

  async getStats(userId: string) {
    const stats = await this.prisma.userStats.findUnique({ where: { userId } });
    if (!stats) throw new NotFoundException('Stats not initialised');
    // Apply regen and persist if it changed so the client always sees fresh hearts.
    const regen = applyHeartRegen(stats.hearts, stats.lastHeartRefillAt);
    if (regen.hearts !== stats.hearts || regen.lastHeartRefillAt !== stats.lastHeartRefillAt) {
      await this.prisma.userStats.update({
        where: { userId },
        data: { hearts: regen.hearts, lastHeartRefillAt: regen.lastHeartRefillAt },
      });
    }
    return {
      ...stats,
      hearts: regen.hearts,
      lastHeartRefillAt: regen.lastHeartRefillAt,
      nextHeartAt: regen.nextHeartAt ? regen.nextHeartAt.toISOString() : null,
      heartRegenIntervalMs: HEARTS.REGEN_INTERVAL_MS,
      maxHearts: HEARTS.MAX,
      heartRefillCostDiamonds: HEARTS.REFILL_COST_DIAMONDS,
    };
  }
}

