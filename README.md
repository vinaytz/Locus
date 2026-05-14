# Locus — Gamified Learning Platform

Locus is a full-stack, Duolingo-style learning platform built for exam and subject preparation. It combines gamification mechanics — XP, streaks, hearts, leagues, and leaderboards — with a structured curriculum to make studying engaging. The platform consists of three independent apps: a NestJS REST API, a Next.js admin console, and a React Native mobile app.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Gamification Mechanics](#gamification-mechanics)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Each App](#running-each-app)
- [Database Setup](#database-setup)
- [Background Jobs](#background-jobs)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Mobile App                           │
│              React Native + Expo (expo-router)              │
│         Student-facing: lessons, streaks, leaderboard       │
└─────────────────────────┬───────────────────────────────────┘
                          │  REST (JWT)
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      Backend API                            │
│              NestJS + TypeScript  (:3000)                   │
│   Auth · Courses · Gamification · Leaderboard · Admin       │
│                          │                                  │
│          ┌───────────────┼──────────────────┐               │
│          ▼               ▼                  ▼               │
│     PostgreSQL         Redis           @nestjs/schedule     │
│    (Prisma ORM)     (leaderboard       (streak reset,       │
│                      cache)            heart regen)         │
└─────────────────────────────────────────────────────────────┘
                          │  REST (x-admin-token, server-side only)
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Admin Dashboard                          │
│              Next.js 14  (:4000)                            │
│       Content management: subjects, units, questions        │
└─────────────────────────────────────────────────────────────┘
```

The backend is the single source of truth. The mobile app communicates over JWT-authenticated REST. The admin console proxies every request server-side so the admin token is never exposed to the browser.

---

## Tech Stack

### Backend (`backend/`)

| Layer | Technology |
|---|---|
| Framework | NestJS 10 (Node.js + TypeScript) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + Passport + bcryptjs |
| Cache | Redis via ioredis |
| Scheduling | @nestjs/schedule |
| Validation | class-validator, class-transformer |

### Admin Dashboard (`admin/`)

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | shadcn/ui + Radix UI |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |

### Mobile App (`mobile/`)

| Layer | Technology |
|---|---|
| Framework | React Native + Expo |
| Routing | expo-router (file-based) |
| State | React Context (Auth, Progress) |
| Persistence | AsyncStorage |
| Animation | react-native-reanimated |
| Gestures | react-native-gesture-handler |
| Icons | Expo Vector Icons + HugeIcons |

---

## Features

**For Students (Mobile)**
- Dual onboarding: enroll by exam (JEE, SAT, etc.) or by subject with difficulty levels (Foundation / Intermediate / Advanced)
- Sinusoidal lesson roadmap — nodes unlock sequentially as exercises are completed
- Five question types: MCQ, Translate (word-bank drag-drop), Matching pairs, Complete the sentence, Reorder
- XP and diamond rewards on every exercise completion
- Hearts system — wrong answers cost hearts; hearts regenerate over time
- Daily streak tracking per user timezone
- League-based leaderboard with promotion and demotion each season
- Offline-resilient via AsyncStorage caching

**For Admins (Dashboard)**
- Full CRUD for all content: Subjects → Units → Exercises → Questions
- Exam management and subject bundling
- Overview dashboard with platform-wide counters
- Paginated content listings

---

## Project Structure

```
locus/
├── backend/                     # NestJS API
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   └── src/
│       ├── auth/                # Registration & login
│       ├── courses/             # Content browsing (public)
│       ├── users/               # Profile, enrollments
│       ├── gamification/        # XP, hearts, streaks, diamonds
│       ├── leaderboard/         # Leagues & standings
│       ├── admin/               # Admin CRUD (token-gated)
│       ├── jobs/                # Scheduled background tasks
│       └── main.ts
│
├── admin/                       # Next.js admin console
│   └── src/
│       ├── app/(console)/       # Page routes (subjects, exams, etc.)
│       ├── lib/
│       │   ├── admin-api.ts     # Server-side API proxy
│       │   └── types.ts         # Shared TypeScript types
│       └── components/
│
├── mobile/                      # React Native / Expo
│   ├── app/                     # File-based routes (expo-router)
│   │   ├── index.tsx            # Boot / auth check
│   │   ├── (auth)/              # Login & registration screens
│   │   ├── (tabs)/              # Main nav: home, leaderboard, profile
│   │   └── exercise/[id].tsx    # Exercise runner
│   └── src/
│       ├── api/client.ts        # Axios instance + interceptors
│       ├── context/             # AuthContext, ProgressContext
│       └── types/index.ts
│
├── Courses/                     # JSON seed data
└── Helper/                      # Architecture & design docs
```

---

## Data Model

```
Subject  ──────────────────────────────────────────
  │ name, slug, level (1-3), icon, description
  │
  └── Unit (orderIndex)
        │ title, description
        │
        └── Exercise (orderIndex)
              │ title, duration (min), points (XP)
              │
              └── Question
                    type: MCQ | MATCH | REORDER | COMPLETE | TRANSLATE
                    prompt, difficulty, content (JSON), explanation

Exam
  └── ExamSubject ──→ Subject  (many-to-many)

User
  ├── UserStats              (XP, diamonds, hearts, streak, leagueIndex)
  ├── UserSubjectEnrollment  (subjectId, difficultyLevel)
  ├── UserExamEnrollment     (examId, examDate)
  ├── ExerciseAttempt        (correctCount, totalCount, xpAwarded, isPerfect)
  └── DiamondLedger          (amount, reason, refId — audit trail)

LeaderboardGroup
  ├── leagueTier (1-30)
  ├── state: WAITING | ACTIVE | CLOSED
  └── LeaderboardParticipant  (userId, seasonXp)
```

Question content is stored as a JSON string, allowing each question type to carry its own schema (options array for MCQ, pairs array for MATCH, etc.) without additional tables.

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <jwt>`.

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account, returns JWT |
| POST | `/auth/login` | Authenticate, returns JWT |

### Courses (public)

| Method | Path | Description |
|---|---|---|
| GET | `/courses/exams` | List all exams |
| GET | `/courses/subjects` | List subjects (`?level=1\|2\|3`) |
| GET | `/courses/subjects/:id` | Subject with its units |
| GET | `/courses/units/:id` | Unit with its exercises |
| GET | `/courses/exercises/:id` | Exercise with its questions |

### Users (JWT required)

| Method | Path | Description |
|---|---|---|
| GET | `/me` | Current user profile + stats |
| GET | `/me/enrollments` | Active exam & subject enrollments |
| POST | `/me/enrollments/exam` | Enroll in an exam (`{ examId, examDate }`) |
| POST | `/me/enrollments/subject` | Enroll in a subject (`{ subjectId, difficultyLevel }`) |
| GET | `/me/progress` | List of completed exercise IDs |

### Gamification (JWT required)

| Method | Path | Description |
|---|---|---|
| POST | `/exercise/complete` | Record attempt, award XP/diamonds, update streak |
| GET | `/stats` | XP, diamonds, hearts, streak, league index |
| POST | `/me/hearts/refill` | Spend diamonds to instantly restore hearts |

### Leaderboard (JWT required)

| Method | Path | Description |
|---|---|---|
| GET | `/leaderboard` | Current league group standings |
| POST | `/leaderboard/join` | Join / auto-place into a league group |

### Admin (`x-admin-token` header required)

| Method | Path | Description |
|---|---|---|
| GET | `/admin/overview` | Platform counters (users, content counts) |
| GET/POST | `/admin/subjects` | List or create subjects |
| GET/PUT/DELETE | `/admin/subjects/:id` | Read, update, or delete a subject |
| GET/POST | `/admin/exams` | List or create exams |
| GET/PUT/DELETE | `/admin/exams/:id` | Read, update, or delete an exam |
| GET/POST | `/admin/units` | List or create units |
| GET/PUT/DELETE | `/admin/units/:id` | Read, update, or delete a unit |
| GET/POST | `/admin/exercises` | List or create exercises |
| GET/PUT/DELETE | `/admin/exercises/:id` | Read, update, or delete an exercise |
| GET/POST | `/admin/questions` | List or create questions |
| GET/PUT/DELETE | `/admin/questions/:id` | Read, update, or delete a question |

Paginate list endpoints with `?page=1&limit=20`.

---

## Gamification Mechanics

### XP & Diamonds

| Event | Reward |
|---|---|
| Complete an exercise | 20 XP |
| Perfect score (no mistakes) | +5 XP bonus |
| Complete a unit | 100 diamonds |
| 7-day streak milestone | 150 diamonds |

### Hearts

- Maximum 5 hearts per user
- Every wrong answer in an exercise costs 1 heart
- 1 heart regenerates every 30 minutes (computed on-demand — no polling job needed)
- Hearts can be instantly refilled by spending diamonds via `POST /me/hearts/refill`

### Streaks

- Tracked per user timezone (stored as IANA timezone string on the User record)
- Completing any exercise before midnight local time maintains the streak
- Missing a full calendar day resets the streak to 0
- A background job (`npm run streak:reset`) enforces resets daily

### Leagues & Leaderboard

- 30 league tiers (1 = Novice → 30 = Expert)
- Users are placed into groups of 12 when they join
- Season length: 10 days
- Each season: top 5 in a group promote (+1 tier), bottom 3 demote (-1 tier)
- Standings are ranked by `seasonXp` — XP earned in the current season only
- Redis caches standings to reduce database load on frequent leaderboard reads

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (optional — leaderboard cache; app degrades gracefully without it)
- Expo CLI for mobile development (`npm install -g expo-cli`)

### Clone

```bash
git clone <repo-url>
cd locus
```

---

## Environment Variables

### Backend — `backend/.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/locus
REDIS_URL=redis://localhost:6379
PORT=3000
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_API_TOKEN=replace-with-a-strong-admin-token
```

### Admin Dashboard — `admin/.env.local`

```env
BACKEND_URL=http://localhost:3000
ADMIN_API_TOKEN=replace-with-the-same-admin-token-as-backend
ADMIN_USERNAME=LocusAdmin
ADMIN_PASSWORD=YourSecurePassword
AUTH_SECRET=replace-with-a-long-random-string
```

`ADMIN_API_TOKEN` is used server-side only inside Next.js route handlers and is never sent to the browser.

### Mobile — `mobile/.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

For a physical device on the same LAN, replace `localhost` with your machine's IP address. For production, point this to the deployed backend URL.

---

## Running Each App

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev     # applies migrations, creates the schema
npm run seed               # (optional) seed subjects, units, exercises
npm run start:dev          # hot-reload dev server on :3000
```

Production:

```bash
npm run build
npm run start:prod
```

### Admin Dashboard

```bash
cd admin
npm install
npm run dev                # dev server on :4000
```

Production:

```bash
npm run build
npm run start
```

### Mobile App

```bash
cd mobile
npm install
npx expo start
# press  a  → Android emulator
# press  i  → iOS simulator
# press  w  → web browser
```

Production build via EAS:

```bash
eas build --platform android
eas build --platform ios
```

---

## Database Setup

Prisma manages all migrations.

```bash
# Apply migrations in CI / production
npx prisma migrate deploy

# Reset database and re-run all migrations (development only — destroys all data)
npx prisma migrate reset

# Open Prisma Studio to browse data visually
npx prisma studio
```

Seed data is in `Courses/database.json` and is loaded by `npm run seed` from inside the `backend/` directory.

---

## Background Jobs

### Streak Reset

Resets the streak for any user who did not complete an exercise the previous day (relative to their stored timezone).

```bash
# Run manually
cd backend
npm run streak:reset

# Recommended: schedule as a daily cron on your server
0 1 * * * cd /app/backend && node dist/jobs/streak-reset.js
```

### Heart Regeneration

Heart regeneration is computed on-demand — not by a scheduled job. Every time a user's stats are read, the backend calculates how many 30-minute windows have elapsed since `lastHeartRefillAt` and adds the corresponding hearts, capped at 5. No background process is required.
