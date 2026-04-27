import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.module';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { dateKeyInTz } from '../gamification/streak.util';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly leaderboard: LeaderboardService,
  ) {}

  /**
   * Daily streak resetter (spec §2.2). Runs at 00:01 server time. Each
   * user's "today" is computed in their own timezone — users whose last
   * activity was strictly before *their* yesterday have streak set to 0.
   */
  @Cron('1 0 * * *')
  async resetBrokenStreaks() {
    const now = new Date();
    const candidates = await this.prisma.user.findMany({
      where: { stats: { currentStreak: { gt: 0 } } },
      select: { id: true, timezone: true, stats: true },
    });
    let reset = 0;
    for (const u of candidates) {
      if (!u.stats?.lastActivityDate) continue;
      const yesterdayKey = dateKeyInTz(new Date(now.getTime() - 86_400_000), u.timezone || 'UTC');
      const lastKey = dateKeyInTz(u.stats.lastActivityDate, u.timezone || 'UTC');
      if (lastKey < yesterdayKey) {
        await this.prisma.userStats.update({
          where: { userId: u.id },
          data: { currentStreak: 0 },
        });
        reset++;
      }
    }
    if (reset) this.logger.log(`Streak resetter: cleared ${reset} streaks`);
    return { reset };
  }

  /**
   * Close any leaderboard groups whose 10-day timer expired and apply
   * promotion/demotion. Runs every 10 minutes — frequent enough to feel
   * real-time, cheap enough on SQLite.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async closeExpiredGroups() {
    const result = await this.leaderboard.closeExpiredGroups();
    if (result.closed) this.logger.log(`Leaderboard sweeper: closed ${result.closed} groups`);
    return result;
  }
}
