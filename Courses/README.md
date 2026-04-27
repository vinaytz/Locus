# Courses Dataset

Self-contained question bank for the MCQ platform, built from the schema in
[Helper/Scalable MCQ App Database Architecture.md](../Helper/Scalable%20MCQ%20App%20Database%20Architecture.md).

## Files

- [schema.sql](schema.sql) — SQLite-compatible DDL (subjects, units, exercises, exams, exam_subjects, questions).
- [generate.js](generate.js) — Authoritative content source. Regenerates `database.json` and `seed.sql`.
- [database.json](database.json) — Full denormalized dataset (consume directly from the app).
- [seed.sql](seed.sql) — INSERT statements for SQLite/Postgres.
- [stats.json](stats.json) — Row counts.

## Contents

| Entity | Count |
| --- | --- |
| Exams | 5 |
| Subjects | 10 |
| Units | 33 |
| Exercises | 36 |
| Questions | 180 |
| Exam ↔ Subject links | 18 |

### Exams
1. JEE Main 2026 — Physics, Chemistry, Mathematics
2. NEET 2026 — Physics, Chemistry, Biology
3. NIMCET 2026 — Mathematics, Computer Science, Reasoning, English
4. GATE CSE 2026 — Computer Science, Mathematics, Reasoning
5. UPSC Prelims 2026 — History, Geography, General Knowledge, English, Reasoning

### Subjects
Physics, Chemistry, Biology, Mathematics, Computer Science, English, General Knowledge, Reasoning, History, Geography.

Each subject has 3–4 units, each unit ≥1 exercise, each exercise 5 questions across the
five supported types: `MCQ`, `MATCH`, `REORDER`, `COMPLETE`, `TRANSLATE`.

## Usage

### From JavaScript / TypeScript
```ts
import db from "../Courses/database.json";
const physics = db.subjects.find(s => s.slug === "physics");
const units = db.units.filter(u => u.subject_id === physics.id);
```

### Loading into SQLite
```bash
sqlite3 courses.db < Courses/schema.sql
sqlite3 courses.db < Courses/seed.sql
```

### Regenerating after edits
Edit `generate.js` (the `SUBJECTS` and `EXAMS` arrays), then:
```bash
node Courses/generate.js
```

## Question payload shapes (stored in `questions.content` as JSON)

| Type | Payload |
| --- | --- |
| `MCQ` | `{ "options": [...], "correct_index": n }` |
| `MATCH` | `{ "left": [...], "right": [...], "map": { l: r } }` |
| `REORDER` | `{ "items": [...], "order": [i, ...] }` |
| `COMPLETE` | `{ "blanks": [...] }` (prompt contains `___`) |
| `TRANSLATE` | `{ "answer": "..." }` |
