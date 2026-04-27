# DuoClone — Duolingo-style React Native App

A premium, dark-themed Duolingo clone built with **Expo + expo-router + TypeScript**.
Designed as a clean, modular **frontend prototype** that is wired through a single
data-service layer (`src/api/client.ts`) so the in-memory mock data can be swapped
for a real backend (matching the schema in [Helper/Scalable MCQ App Database
Architecture.md](../Helper/Scalable%20MCQ%20App%20Database%20Architecture.md))
without changing UI code.

## Run

```bash
cd DuoClone
npm install
npx expo start
```

Open the QR code in **Expo Go** (Android/iOS), or press `a` / `i` to launch a
simulator, or `w` for the web build.

## App flow

```
           ┌──────────────────────────────────────────────┐
boot ──▶   │  app/index.tsx  (decides where to land)      │
           └────────────┬─────────────────────────────────┘
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
  /auth (no user)  /onboarding (no lang)  /(tabs)/home (ready)
```

* **AuthScreen** — Google (mock) or email + name. Persists user via AsyncStorage.
* **OnboardingScreen** — Pick a language (Spanish / French / German). Sets it as the active course.
* **Tabs**
  * **Home** — Top nav (flag · streak · gems · MAX) + sinusoidal lesson roadmap.
  * **Leaderboard** — Pearl League with promotion zone (matches the screenshots).
  * **Profile** — User card, stats, course swap, log out.
* **Exercise runner** (`/exercise/[id]`) — Mixes 4 question types: MCQ, Translate (word bank), Match pairs, Complete the sentence. Tracks XP, hearts, accuracy and a completion screen.
* **Streak** (`/streak`) and **Shop** (`/shop`) — Linked from the top nav.

## Folder structure

```
DuoClone/
├── app/                          # expo-router file-based routing
│   ├── _layout.tsx               # Providers + Stack
│   ├── index.tsx                 # Boot redirect (auth → onboarding → home)
│   ├── auth.tsx                  # AuthPage
│   ├── onboarding.tsx            # OnboardPage
│   ├── (tabs)/                   # Bottom tabs
│   │   ├── _layout.tsx
│   │   ├── home.tsx              # Roadmap (sin-wave lesson path)
│   │   ├── leaderboard.tsx
│   │   └── profile.tsx
│   ├── exercise/[id].tsx         # Exercise runner
│   ├── streak.tsx                # Day-streak page (top-nav linked)
│   └── shop.tsx                  # Diamond / shop page (top-nav linked)
└── src/
    ├── api/client.ts             # SWAP HERE: mock → backend
    ├── data/                     # Mock JSON-style content (3 languages, 3 units each)
    │   ├── languages.ts
    │   └── leaderboard.ts
    ├── context/
    │   ├── AuthContext.tsx       # User / login / persistence
    │   └── ProgressContext.tsx   # Active language, XP, gems, streak, hearts, completed
    ├── components/
    │   ├── DuoButton.tsx         # Chunky 3D button (top face + shadow face)
    │   ├── TopNav.tsx            # Flag · Streak · Gems · MAX
    │   ├── UnitHeader.tsx        # Orange "SECTION x, UNIT y" sticky banner
    │   ├── LessonNode.tsx        # Round 3D node (lesson/listen/speak/chest)
    │   ├── ProgressBar.tsx
    │   └── questions/
    │       ├── QuestionRenderer.tsx   # Strategy switch by question.type
    │       ├── MCQ.tsx
    │       ├── Translate.tsx
    │       ├── Match.tsx
    │       └── Complete.tsx
    ├── theme/
    │   ├── colors.ts             # Duolingo dark palette
    │   └── typography.ts
    └── types/index.ts            # Domain types (mirror the planned DB schema)
```

## Data model — designed for the future backend

The types in [`src/types/index.ts`](src/types/index.ts) intentionally mirror the
Subject → Unit → Exercise → Question hierarchy from the schema doc. Question
content uses a discriminated union that maps 1-to-1 to the `JSONB content`
column described there:

| Type        | Content payload                                                  |
| ----------- | ---------------------------------------------------------------- |
| `mcq`       | `{ word, options[], correctId }`                                 |
| `translate` | `{ sentence, bank[], answer[] }` (word-tile reorder)             |
| `match`     | `{ pairs: [{left, right}] }`                                     |
| `complete`  | `{ before, after, options[], answer }`                           |

## Migrating to a real backend

1. Replace each function body in [`src/api/client.ts`](src/api/client.ts) with a
   real `fetch` (REST or GraphQL). Keep the **signatures** identical.
2. Rename `LANGUAGES` to your endpoint (e.g. `GET /languages`) and pull units +
   exercises lazily by id (`GET /units/:id`, `GET /exercises/:id`) — the screens
   already call `api.getLanguage`, `api.getUnit`, `api.getExercise`.
3. Optionally introduce React Query / SWR around the same `api` calls; UI does
   not need to change.
4. Replace `ProgressContext`'s AsyncStorage persistence with server sync
   (`PATCH /me/progress`), keeping the same interface.

That's it — the entire UI tree is decoupled from the data source.
