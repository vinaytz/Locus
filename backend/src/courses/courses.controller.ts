import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get('exams')
  exams() {
    return this.courses.listExams();
  }

  @Get('subjects')
  subjects(@Query('level') level?: string) {
    const lvl = level ? Number(level) : undefined;
    return this.courses.listSubjects(lvl && [1, 2, 3].includes(lvl) ? lvl : undefined);
  }

  @Get('subjects/:id')
  subject(@Param('id') id: string) {
    return this.courses.getSubject(id);
  }

  @Get('units/:id')
  unit(@Param('id') id: string) {
    return this.courses.getUnit(id);
  }

  @Get('exercises/:id')
  exercise(@Param('id') id: string) {
    return this.courses.getExercise(id);
  }
}
