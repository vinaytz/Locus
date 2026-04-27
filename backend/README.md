# Locus Backend

NestJS + Prisma (SQLite) backend for the Locus learning app. Implements:

- Auth (JWT email/password)
- Onboarding (exam-based with date, subject-based with difficulty 1/2/3)
- Courses API (exams → subjects → units → exercises → questions, JSON payload)
- Gamification per [Helper/gamification_spec.md](../Helper/gamification_spec.md):
  XP, perfect bonus, diamonds, day-streak with timezone-aware reset,
  unit-completion bonus.
- Asynchronous League leaderboard (12-user lobbies, 10-day seasons, Redis ZSET cache,
  promotion/demotion sweeper).

## Setup

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run start:dev
```

Server listens on `http://localhost:3000/api`.

## Config (`.env`)

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file URL (default `file:./dev.db`) |
| `JWT_SECRET` | JWT signing key |
| `REDIS_URL` | Upstash/Redis URL for leaderboard ZSETs |

## Endpoints

### Auth
- `POST /api/auth/register` — `{ email, password, displayName, timezone? }`
- `POST /api/auth/login` — `{ email, password }`

Both return `{ accessToken, user }`. Pass `Authorization: Bearer <token>` for protected routes.

### Me / Onboarding
- `GET  /api/me`
- `GET  /api/me/enrollments`
- `POST /api/me/enrollments/exam` — `{ examId, examDate (ISO) }`
- `POST /api/me/enrollments/subject` — `{ subjectId, difficulty (1|2|3) }`

### Courses
- `GET /api/courses/exams`
- `GET /api/courses/subjects?level=1|2|3`
- `GET /api/courses/subjects/:id`
- `GET /api/courses/units/:id`
- `GET /api/courses/exercises/:id` *(returns parsed `content` JSON for each question)*

### Gamification
- `POST /api/exercise/complete` — `{ exerciseId, results: boolean[] }`
  Returns awarded XP, diamonds, streak status, and updated totals.
- `GET  /api/stats`

### Leaderboard
- `GET  /api/leaderboard` — current group ranking + remaining seconds
- `POST /api/leaderboard/join` — explicit placement (auto-called on XP)

## Background jobs

Defined in [src/jobs/jobs.service.ts](src/jobs/jobs.service.ts):

- Daily `0 0 1 * * *` — reset broken streaks (timezone-aware).
- Every 10 min — close expired leaderboard groups & apply promotion/demotion.

You can also run `npm run streak:reset` from cron outside the app.

## Seed

`prisma/seed.ts` + `prisma/seed-bank.ts` build:

- **1 Exam** — JEE Main 2026 (links Physics 2, Chemistry 2, Mathematics 2)
- **5 Subjects × 3 levels = 15 Subject rows** — Physics 1/2/3, Chemistry 1/2/3,
  Mathematics 1/2/3, Biology 1/2/3, Computer Science 1/2/3
- Multiple Units per subject, each Unit with one or two Exercises
- Each Exercise has **10 questions (8 easy + 2 medium)** of mixed types
  (`MCQ`, `COMPLETE`, `MATCH`, `REORDER`).

Re-run anytime with `npm run seed` (it wipes all dependent rows first).
