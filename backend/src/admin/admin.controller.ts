import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import {
  ExamSubjectsDto,
  UpsertExamDto,
  UpsertExerciseDto,
  UpsertQuestionDto,
  UpsertSubjectDto,
  UpsertUnitDto,
} from './admin.dto';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview') overview() { return this.admin.overview(); }

  // -------- Subjects --------
  @Get('subjects') listSubjects(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.admin.listSubjects({ page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }
  @Post('subjects') createSubject(@Body() dto: UpsertSubjectDto) { return this.admin.createSubject(dto); }
  @Put('subjects/:id') updateSubject(@Param('id') id: string, @Body() dto: UpsertSubjectDto) {
    return this.admin.updateSubject(id, dto);
  }
  @Delete('subjects/:id') deleteSubject(@Param('id') id: string) { return this.admin.deleteSubject(id); }

  // -------- Exams --------
  @Get('exams') listExams(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.admin.listExams({ page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }
  @Post('exams') createExam(@Body() dto: UpsertExamDto) { return this.admin.createExam(dto); }
  @Put('exams/:id') updateExam(@Param('id') id: string, @Body() dto: UpsertExamDto) {
    return this.admin.updateExam(id, dto);
  }
  @Delete('exams/:id') deleteExam(@Param('id') id: string) { return this.admin.deleteExam(id); }
  @Patch('exams/:id/subjects') setExamSubjects(@Param('id') id: string, @Body() dto: ExamSubjectsDto) {
    return this.admin.setExamSubjects(id, dto);
  }

  // -------- Units --------
  @Get('units') listUnits(
    @Query('subjectId') subjectId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listUnits(subjectId, { page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }
  @Post('units') createUnit(@Body() dto: UpsertUnitDto) { return this.admin.createUnit(dto); }
  @Put('units/:id') updateUnit(@Param('id') id: string, @Body() dto: UpsertUnitDto) {
    return this.admin.updateUnit(id, dto);
  }
  @Delete('units/:id') deleteUnit(@Param('id') id: string) { return this.admin.deleteUnit(id); }

  // -------- Exercises --------
  @Get('exercises') listExercises(
    @Query('unitId') unitId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listExercises(unitId, { page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }
  @Post('exercises') createExercise(@Body() dto: UpsertExerciseDto) { return this.admin.createExercise(dto); }
  @Put('exercises/:id') updateExercise(@Param('id') id: string, @Body() dto: UpsertExerciseDto) {
    return this.admin.updateExercise(id, dto);
  }
  @Delete('exercises/:id') deleteExercise(@Param('id') id: string) { return this.admin.deleteExercise(id); }

  // -------- Questions --------
  @Get('questions') listQuestions(
    @Query('exerciseId') exerciseId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listQuestions(exerciseId, { page: page ? +page : undefined, limit: limit ? +limit : undefined });
  }
  @Get('questions/:id') getQuestion(@Param('id') id: string) { return this.admin.getQuestion(id); }
  @Post('questions') createQuestion(@Body() dto: UpsertQuestionDto) { return this.admin.createQuestion(dto); }
  @Put('questions/:id') updateQuestion(@Param('id') id: string, @Body() dto: UpsertQuestionDto) {
    return this.admin.updateQuestion(id, dto);
  }
  @Delete('questions/:id') deleteQuestion(@Param('id') id: string) { return this.admin.deleteQuestion(id); }
}
