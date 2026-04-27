import { Module, forwardRef } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [forwardRef(() => LeaderboardModule)],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
