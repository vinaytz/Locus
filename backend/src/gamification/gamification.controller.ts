import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, AuthUser } from '../auth/jwt-auth.guard';
import { GamificationService } from './gamification.service';
import { CompleteExerciseDto } from './gamification.dto';
import { RefillHeartsDto } from '../users/users.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly svc: GamificationService) {}

  @Post('exercise/complete')
  complete(@CurrentUser() user: AuthUser, @Body() dto: CompleteExerciseDto) {
    return this.svc.completeExercise(user.id, dto);
  }

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.svc.getStats(user.id);
  }

  @Get('me/progress')
  progress(@CurrentUser() user: AuthUser) {
    return this.svc.getCompletedExerciseIds(user.id).then((completedExerciseIds) => ({
      completedExerciseIds,
    }));
  }

  @Post('me/hearts/refill')
  refill(@CurrentUser() user: AuthUser, @Body() dto: RefillHeartsDto) {
    return this.svc.refillHearts(user.id, dto.count ?? 1);
  }
}
