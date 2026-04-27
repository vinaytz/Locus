import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, AuthUser } from '../auth/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly svc: LeaderboardService) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.svc.getMyLeaderboard(user.id);
  }

  @Post('join')
  join(@CurrentUser() user: AuthUser) {
    return this.svc.ensurePlacement(user.id);
  }
}
