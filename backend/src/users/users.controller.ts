import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, AuthUser } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { EnrollExamDto, EnrollSubjectDto } from './users.dto';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.users.getMe(user.id);
  }

  @Get('enrollments')
  list(@CurrentUser() user: AuthUser) {
    return this.users.listEnrollments(user.id);
  }

  @Post('enrollments/exam')
  enrollExam(@CurrentUser() user: AuthUser, @Body() dto: EnrollExamDto) {
    return this.users.enrollExam(user.id, dto);
  }

  @Post('enrollments/subject')
  enrollSubject(@CurrentUser() user: AuthUser, @Body() dto: EnrollSubjectDto) {
    return this.users.enrollSubject(user.id, dto);
  }
}
