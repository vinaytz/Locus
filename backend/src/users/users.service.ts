import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { EnrollExamDto, EnrollSubjectDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        stats: true,
        examEnrollments: { include: { exam: true } },
        subjectEnrollments: { include: { subject: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async enrollExam(userId: string, dto: EnrollExamDto) {
    const exam = await this.prisma.exam.findUnique({ where: { id: dto.examId } });
    if (!exam) throw new NotFoundException('Exam not found');
    const examDate = new Date(dto.examDate);
    if (Number.isNaN(examDate.getTime())) throw new BadRequestException('Invalid examDate');

    return this.prisma.userExamEnrollment.upsert({
      where: { userId_examId: { userId, examId: dto.examId } },
      update: { examDate },
      create: { userId, examId: dto.examId, examDate },
      include: { exam: true },
    });
  }

  async enrollSubject(userId: string, dto: EnrollSubjectDto) {
    const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) throw new NotFoundException('Subject not found');
    if (![1, 2, 3].includes(dto.difficulty))
      throw new BadRequestException('difficulty must be 1, 2 or 3');

    // A "subject" in product terms (Biology) maps to multiple Subject rows
    // (Biology 1/2/3 — one per level). A user should have at most one
    // enrollment per subject NAME, so when they pick a different level/difficulty
    // we drop their other enrollments in the same group before upserting.
    const sameGroupSubjectIds = (
      await this.prisma.subject.findMany({
        where: { name: subject.name, NOT: { id: subject.id } },
        select: { id: true },
      })
    ).map((s) => s.id);

    if (sameGroupSubjectIds.length) {
      await this.prisma.userSubjectEnrollment.deleteMany({
        where: { userId, subjectId: { in: sameGroupSubjectIds } },
      });
    }

    return this.prisma.userSubjectEnrollment.upsert({
      where: { userId_subjectId: { userId, subjectId: dto.subjectId } },
      update: { difficulty: dto.difficulty },
      create: { userId, subjectId: dto.subjectId, difficulty: dto.difficulty },
      include: { subject: true },
    });
  }

  async listEnrollments(userId: string) {
    const [exams, subjects] = await Promise.all([
      this.prisma.userExamEnrollment.findMany({
        where: { userId },
        include: { exam: { include: { subjects: { include: { subject: true } } } } },
      }),
      this.prisma.userSubjectEnrollment.findMany({
        where: { userId },
        include: { subject: true },
      }),
    ]);
    return { exams, subjects };
  }
}
