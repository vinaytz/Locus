/**
 * Seeds the database with: 1 Exam (JEE Main 2026) and 5 Subjects, each
 * authored at 3 difficulty levels (Subject 1/2/3 ≈ Class 10 / Class 12 /
 * Graduate). Each Subject contains 3 Units, each Unit has at least 1
 * Exercise (most have 2), and each Exercise has 10 questions (8 easy +
 * 2 medium) per the spec.
 *
 * Run: `npm run seed`
 */

import { PrismaClient } from '@prisma/client';
import {
  buildSubjectBank,
  SUBJECT_DEFS,
  EXAM_DEFS,
  slug,
} from './seed-bank';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding…');

  // Wipe in dependency order
  await prisma.$transaction([
    prisma.exerciseAttempt.deleteMany(),
    prisma.diamondLedger.deleteMany(),
    prisma.leaderboardParticipant.deleteMany(),
    prisma.leaderboardGroup.deleteMany(),
    prisma.userSubjectEnrollment.deleteMany(),
    prisma.userExamEnrollment.deleteMany(),
    prisma.examSubject.deleteMany(),
    prisma.question.deleteMany(),
    prisma.exercise.deleteMany(),
    prisma.unit.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.exam.deleteMany(),
  ]);

  // --- Subjects (×3 levels each) -----------------------------------------
  const createdSubjects: { id: string; slug: string }[] = [];

  for (const subjectDef of SUBJECT_DEFS) {
    for (const level of [1, 2, 3] as const) {
      const displayName = `${subjectDef.name} ${level}`;
      const subjectSlug = slug(displayName);

      const subject = await prisma.subject.create({
        data: {
          slug: subjectSlug,
          name: subjectDef.name,
          displayName,
          level,
          icon: subjectDef.icon,
          description: subjectDef.descriptions[level - 1],
        },
      });
      createdSubjects.push({ id: subject.id, slug: subject.slug });

      const units = buildSubjectBank(subjectDef.name, level);
      for (let ui = 0; ui < units.length; ui++) {
        const u = units[ui];
        const unit = await prisma.unit.create({
          data: {
            subjectId: subject.id,
            title: u.title,
            description: u.description,
            orderIndex: ui,
          },
        });
        for (let ei = 0; ei < u.exercises.length; ei++) {
          const ex = u.exercises[ei];
          const exercise = await prisma.exercise.create({
            data: {
              unitId: unit.id,
              title: ex.title,
              orderIndex: ei,
              duration: 5 + ei,
              points: 20,
            },
          });
          await prisma.question.createMany({
            data: ex.questions.map((q) => ({
              exerciseId: exercise.id,
              type: q.type,
              prompt: q.prompt,
              difficulty: q.difficulty,
              points: q.difficulty === 'medium' ? 15 : 10,
              content: JSON.stringify(q.content),
              explanation: q.explanation ?? null,
            })),
          });
        }
      }
      console.log(`  ✓ ${displayName} (${units.length} units)`);
    }
  }

  // --- Exams --------------------------------------------------------------
  for (const examDef of EXAM_DEFS) {
    const exam = await prisma.exam.create({
      data: { slug: examDef.slug, title: examDef.title, description: examDef.description },
    });
    for (let i = 0; i < examDef.subjectMatchers.length; i++) {
      const target = examDef.subjectMatchers[i];
      const matched = createdSubjects.find((s) => s.slug === target);
      if (!matched) {
        console.warn(`  ! exam ${examDef.slug}: subject not found for slug ${target}`);
        continue;
      }
      await prisma.examSubject.create({
        data: { examId: exam.id, subjectId: matched.id, orderIndex: i },
      });
    }
    console.log(`  ✓ exam ${examDef.slug} (${examDef.subjectMatchers.length} subjects)`);
  }

  // --- Stats ---------------------------------------------------------------
  const counts = await prisma.$transaction([
    prisma.exam.count(),
    prisma.subject.count(),
    prisma.unit.count(),
    prisma.exercise.count(),
    prisma.question.count(),
    prisma.examSubject.count(),
  ]);
  console.log('Done.', {
    exams: counts[0],
    subjects: counts[1],
    units: counts[2],
    exercises: counts[3],
    questions: counts[4],
    examSubjects: counts[5],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
