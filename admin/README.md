# Locus Admin Console

A Next.js 14 + Tailwind + shadcn/ui dashboard for managing the Locus learning content.
It talks to the existing NestJS backend through a server-side proxy so the admin token
never reaches the browser.

## What you can manage

- **Subjects** (Spanish 1, Algebra, …) — slug, level, icon, description
- **Exams** — top-level bundles of subjects (e.g. JEE, SAT)
- **Units** — chapters inside a subject
- **Exercises** — lessons inside a unit (duration, points)
- **Questions** — MCQ, Translate, Match, Complete, Reorder

Anything created here lands directly in the same SQLite DB the mobile app reads.

## Run

1. **Backend** (in `../backend`)

   ```bash
   cd ../backend
   npm install
   # make sure .env has ADMIN_API_TOKEN set (see below)
   npm run start:dev   # listens on :3000
   ```

2. **Admin** (this folder)

   ```bash
   cd admin
   npm install
   cp .env.local.example .env.local   # if you don't have one
   npm run dev                        # listens on :4000
   ```

3. Open <http://localhost:4000>

## Environment

`admin/.env.local`:

```
BACKEND_URL=http://localhost:3000
ADMIN_API_TOKEN=dev-admin-token-change-me
```

`backend/.env` must have the **same** `ADMIN_API_TOKEN`. Change both values for any
non-development deployment.

## How auth works

- Every browser request goes to `/api/admin/*` (Next.js route handler).
- That handler calls the NestJS backend at `/api/admin/*` adding the `x-admin-token`
  header from the server's environment.
- The token never reaches client JavaScript.

## Folder structure

```
src/
  app/
    (console)/        ← sidebar + page shell
      page.tsx        ← dashboard
      subjects/
      exams/
      units/
      exercises/
      questions/
    api/admin/[...path]/route.ts   ← server proxy
  components/
    ui/               ← shadcn primitives
    sidebar.tsx
    page-header.tsx
    row-actions.tsx
  lib/
    admin-api.ts      ← server fetch w/ token
    client-api.ts     ← browser fetch w/o token
    types.ts
    utils.ts
```
