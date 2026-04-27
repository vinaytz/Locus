import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  listExams() {
    return this.prisma.exam.findMany({
      orderBy: { title: 'asc' },
      include: {
        subjects: {
          orderBy: { orderIndex: 'asc' },
          include: { subject: true },
        },
      },
    });
  }

  listSubjects(level?: number) {
    return this.prisma.subject.findMany({
      where: level ? { level } : undefined,
      orderBy: [{ name: 'asc' }, { level: 'asc' }],
    });
  }

  async getSubject(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: { orderIndex: 'asc' },
          include: {
            exercises: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async getUnit(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        exercises: { orderBy: { orderIndex: 'asc' } },
        subject: true,
      },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async getExercise(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: {
        unit: { include: { subject: true } },
        questions: true,
      },
    });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return {
      ...exercise,
      questions: exercise.questions.map((q) => ({
        ...q,
        content: safeJson(q.content),
      })),
    };
  }
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
