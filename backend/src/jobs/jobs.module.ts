import { Module } from '@nestjs/common';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { JobsService } from './jobs.service';

@Module({
  imports: [LeaderboardModule],
  providers: [JobsService],
})
export class JobsModule {}
