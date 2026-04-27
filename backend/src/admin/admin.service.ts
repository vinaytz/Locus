import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import {
  ExamSubjectsDto,
  UpsertExamDto,
  UpsertExerciseDto,
  UpsertQuestionDto,
  UpsertSubjectDto,
  UpsertUnitDto,
} from './admin.dto';

export interface PageOpts {
  page?: number;
  limit?: number;
}

function pageArgs(opts: PageOpts) {
  const page = Math.max(1, Number(opts.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(opts.limit) || 20));
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

function paged<T>(items: T[], total: number, page: number, limit: number) {
  return { items, total, page, limit };
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Overview ----------
  async overview() {
    const [users, exams, subjects, units, exercises, questions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.exam.count(),
      this.prisma.subject.count(),
      this.prisma.unit.count(),
      this.prisma.exercise.count(),
      this.prisma.question.count(),
    ]);
    return { users, exams, subjects, units, exercises, questions };
  }

  // ---------- Subjects ----------
  async listSubjects(opts: PageOpts = {}) {
    const { page, limit, skip, take } = pageArgs(opts);
    const [items, total] = await Promise.all([
      this.prisma.subject.findMany({
        orderBy: [{ name: 'asc' }, { level: 'asc' }],
        include: { _count: { select: { units: true } } },
        skip, take,
      }),
      this.prisma.subject.count(),
    ]);
    return paged(items, total, page, limit);
  }
  createSubject(dto: UpsertSubjectDto) {
    return this.prisma.subject.create({ data: dto });
  }
  updateSubject(id: string, dto: UpsertSubjectDto) {
    return this.prisma.subject.update({ where: { id }, data: dto });
  }
  deleteSubject(id: string) {
    return this.prisma.subject.delete({ where: { id } });
  }

  // ---------- Exams ----------
  async listExams(opts: PageOpts = {}) {
    const { page, limit, skip, take } = pageArgs(opts);
    const [items, total] = await Promise.all([
      this.prisma.exam.findMany({
        orderBy: { title: 'asc' },
        include: {
          subjects: { include: { subject: true }, orderBy: { orderIndex: 'asc' } },
        },
        skip, take,
      }),
      this.prisma.exam.count(),
    ]);
    return paged(items, total, page, limit);
  }
  createExam(dto: UpsertExamDto) {
    return this.prisma.exam.create({ data: dto });
  }
  updateExam(id: string, dto: UpsertExamDto) {
    return this.prisma.exam.update({ where: { id }, data: dto });
  }
  deleteExam(id: string) {
    return this.prisma.exam.delete({ where: { id } });
  }
  async setExamSubjects(examId: string, dto: ExamSubjectsDto) {
    await this.prisma.examSubject.deleteMany({ where: { examId } });
    if (dto.subjectIds.length === 0) return { ok: true };
    await this.prisma.examSubject.createMany({
      data: dto.subjectIds.map((subjectId, i) => ({ examId, subjectId, orderIndex: i })),
    });
    return { ok: true };
  }

  // ---------- Units ----------
  async listUnits(subjectId: string | undefined, opts: PageOpts = {}) {
    const { page, limit, skip, take } = pageArgs(opts);
    const where = subjectId ? { subjectId } : undefined;
    const [items, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        orderBy: [{ subjectId: 'asc' }, { orderIndex: 'asc' }],
        include: {
          subject: { select: { id: true, name: true, displayName: true } },
          _count: { select: { exercises: true } },
        },
        skip, take,
      }),
      this.prisma.unit.count({ where }),
    ]);
    return paged(items, total, page, limit);
  }
  createUnit(dto: UpsertUnitDto) {
    return this.prisma.unit.create({ data: dto });
  }
  updateUnit(id: string, dto: UpsertUnitDto) {
    return this.prisma.unit.update({ where: { id }, data: dto });
  }
  deleteUnit(id: string) {
    return this.prisma.unit.delete({ where: { id } });
  }

  // ---------- Exercises ----------
  async listExercises(unitId: string | undefined, opts: PageOpts = {}) {
    const { page, limit, skip, take } = pageArgs(opts);
    const where = unitId ? { unitId } : undefined;
    const [items, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        orderBy: [{ unitId: 'asc' }, { orderIndex: 'asc' }],
        include: {
          unit: { select: { id: true, title: true, subjectId: true } },
          _count: { select: { questions: true } },
        },
        skip, take,
      }),
      this.prisma.exercise.count({ where }),
    ]);
    return paged(items, total, page, limit);
  }
  createExercise(dto: UpsertExerciseDto) {
    return this.prisma.exercise.create({ data: dto });
  }
  updateExercise(id: string, dto: UpsertExerciseDto) {
    return this.prisma.exercise.update({ where: { id }, data: dto });
  }
  deleteExercise(id: string) {
    return this.prisma.exercise.delete({ where: { id } });
  }

  // ---------- Questions ----------
  async listQuestions(exerciseId: string | undefined, opts: PageOpts = {}) {
    const { page, limit, skip, take } = pageArgs(opts);
    const where = exerciseId ? { exerciseId } : undefined;
    const [rows, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        orderBy: { id: 'asc' },
        skip, take,
      }),
      this.prisma.question.count({ where }),
    ]);
    const items = rows.map((q) => ({ ...q, content: safeJson(q.content) }));
    return paged(items, total, page, limit);
  }
  async getQuestion(id: string) {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Question not found');
    return { ...q, content: safeJson(q.content) };
  }
  createQuestion(dto: UpsertQuestionDto) {
    return this.prisma.question.create({
      data: { ...dto, content: JSON.stringify(dto.content) },
    });
  }
  updateQuestion(id: string, dto: UpsertQuestionDto) {
    return this.prisma.question.update({
      where: { id },
      data: { ...dto, content: JSON.stringify(dto.content) },
    });
  }
  deleteQuestion(id: string) {
    return this.prisma.question.delete({ where: { id } });
  }
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
