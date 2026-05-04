# LOCUS — A Gamified Mobile Learning Platform for Competitive Exam Preparation

**A Capstone Project Report**

Submitted in partial fulfilment of the requirements for the degree of
Bachelor of Technology in Computer Science and Engineering

---

**Submitted by:** *[Student Name(s) and Roll Number(s)]*
**Under the supervision of:** *[Supervisor Name and Designation]*
**Department of Computer Science and Engineering**
*[Institution Name]*
*[City, State]*
*[Academic Year 2025–2026]*

---

## Certificate

This is to certify that the project report titled **"Locus — A Gamified Mobile Learning Platform for Competitive Exam Preparation"** is the bonafide work carried out by the above mentioned student(s) of the final year B.Tech (Computer Science and Engineering) under my supervision and guidance. The work presented in this report has not been submitted elsewhere for the award of any other degree or diploma.

To the best of my knowledge, the work reported here is original and has been done by the student(s) themselves. The report meets the standard required for partial fulfilment of the degree.

**Place:** ____________________
**Date:** ____________________

**Project Supervisor**
*[Name, Designation]*

**Head of the Department**
*[Name]*

---

## Declaration by the Student

We hereby declare that the project work presented in this report titled *"Locus — A Gamified Mobile Learning Platform for Competitive Exam Preparation"* is an authentic record of our own work, carried out during the academic year 2025–2026 under the guidance of our project supervisor. The matter embodied in this report has not been submitted by us for the award of any other degree or diploma.

We also declare that all sources of information that have been used have been duly acknowledged in the references.

*[Student Signatures]*

---

## Acknowledgement

We would like to begin by expressing our sincere gratitude to our project guide, who patiently went through every iteration of our design and gave us steady, honest feedback even when the project was rough around the edges. The willingness to question assumptions early — instead of waiting until the end — made a real difference in how the system finally came together.

We are equally thankful to the Head of the Department and to the faculty members of the Department of Computer Science and Engineering for arranging review meetings, providing computing resources, and creating an environment where independent project work was possible. Their advice on scoping the work, choosing the right technologies, and prioritising usable features over flashy ones has shaped this project in ways that are not always visible in the code, but are visible in how the product behaves.

Our thanks also go to the lab staff who helped us with installations, server access and the small but irritating issues that come up when one tries to deploy a Node.js stack on a shared machine. We would also like to thank our peers and seniors who tested early builds of the application and reported the awkward parts that we had stopped noticing.

Finally, we are grateful to our families for their patience during long coding sessions and for the cups of tea that arrived without being asked for.

*[Student Names]*

---

## Abstract

Online preparation for competitive examinations in India has grown into a crowded space, but most products fall into two camps. On one side there are video-heavy platforms that demand long, passive sessions; on the other side, mobile language-learning apps such as Duolingo have shown that short, daily, game-like practice can keep learners coming back for months. The gap, in our view, is a product that takes the engagement design of those language apps and applies it to subject preparation for exams like JEE, NEET and NIMCET, where the actual learning unit is a multiple-choice question rather than a sentence in a foreign language.

This capstone project describes the design, implementation and evaluation of **Locus**, a cross-platform mobile learning system that uses gamification — daily streaks, experience points (XP), in-app currency called *Diamonds*, a *Hearts* lives system, and an asynchronous league-based leaderboard — to encourage consistent, short practice sessions for competitive exam topics. The platform supports two separate onboarding flows: an *exam-based* path, where the user picks a target exam (for example, JEE 2026) and a date, and a *subject-based* path, where the user picks an individual subject and a self-rated difficulty level.

The system is built as three coordinated codebases: a NestJS backend with PostgreSQL and Redis, a React Native (Expo) mobile client, and a Next.js admin console. The data model uses a *hybrid relational–document* approach: a strict relational hierarchy of Subject → Unit → Exercise on top of a flexible JSON column for question payloads, so that different question types — MCQ, matching, reordering, fill-in-the-blank and translate — can share one storage schema without forcing a migration each time a new format is introduced. Redis Sorted Sets are used to power the leaderboard, giving constant-time rank lookups even as the number of players grows. Gamification logic — XP awards, streak updates, heart regeneration, league promotion and demotion — runs inside database transactions and is supported by daily background jobs.

The report presents the requirement analysis, the architectural decisions, the database design, the implementation of the gamification subsystem (including the *asynchronous* lobby-based league system that avoids the unfair "global season" problem of many leaderboard designs), the testing approach, and a discussion of results based on a small pilot with student users. We also outline the limitations of the current build and a roadmap for future work, including adaptive difficulty, spaced-repetition based revision, AI-generated explanations, and integration with adaptive learning research.

**Keywords:** Mobile learning, gamification, NestJS, React Native, PostgreSQL, Redis, leaderboard, MCQ, microservices, capstone project.

---

## Table of Contents

1. Introduction
2. Literature Review and Background Study
3. System Analysis and Requirements
4. System Design and Architecture
5. Database Design and Data Modelling
6. Implementation
7. The Gamification and Leaderboard Subsystem
8. Admin Console and Content Operations
9. Testing and Quality Assurance
10. Results and Discussion
11. Limitations
12. Conclusion and Future Work
13. References
14. Appendix A — API Reference Summary
15. Appendix B — Sample Question Payloads

---

## List of Figures

- Figure 3.1 — Use case diagram of the Locus platform
- Figure 4.1 — High-level deployment architecture
- Figure 4.2 — Layered backend architecture (NestJS modules)
- Figure 4.3 — Mobile application navigation tree
- Figure 5.1 — Educational hierarchy ER diagram
- Figure 5.2 — Gamification ER fragment
- Figure 5.3 — Leaderboard ER fragment
- Figure 7.1 — Asynchronous league lobby state machine
- Figure 7.2 — Daily streak state transitions
- Figure 9.1 — Sample XP curve over a 14-day pilot

## List of Tables

- Table 3.1 — Functional requirements summary
- Table 3.2 — Non-functional requirements summary
- Table 4.1 — Technology stack and rationale
- Table 6.1 — Reward constants
- Table 7.1 — League promotion / demotion zones
- Table 9.1 — Pilot study summary statistics

---

# Chapter 1 — Introduction

## 1.1 Background

For students preparing for entrance examinations in India — be it JEE for engineering, NEET for medicine, NIMCET for the MCA programme, or one of the many state-level tests — practice has always been the heart of the preparation. Traditional coaching centres are built around this idea: a few hours of teaching followed by long sets of objective questions. The shift to digital learning over the last decade has, in some ways, kept the same model. Many popular platforms record long lecture videos and bundle them with downloadable PDFs. Students are expected to watch, take notes, and then go through the question banks on their own.

This format is not bad in itself. It works for students who already have strong study habits. The problem we noticed — and that several of our friends preparing for various exams have echoed — is that the format depends on the student's *intrinsic* motivation almost completely. If a learner has a busy day and skips a lecture, nothing in the platform reminds them to come back. There is no streak that breaks, no group of peers to fall behind, no small daily reward that creates a habit. Compare this with a language-learning app like Duolingo, where a five-minute daily session is enough to keep the streak alive, and the entire interface is designed to make sure the user feels good about coming back tomorrow. The pedagogy may be argued about, but the engagement design is undeniably effective, and the empirical retention numbers reported in industry talks bear this out.

The hypothesis behind Locus is simple: take the engagement loops that have worked so well for language learning and apply them to multiple-choice question (MCQ) practice for competitive exams. Replace the sentence translation exercise with a physics MCQ. Replace the "match the word" exercise with a "match the formula to the law" exercise. Keep the streak, keep the XP bar, keep the leaderboard. The expectation is that students who would otherwise abandon study sessions after the first week will instead sustain shorter but more regular practice — and that small, daily exposure compounds over the months leading up to an exam.

## 1.2 Problem Statement

Most digital exam preparation platforms in the Indian market today do not adequately address learner engagement and habit formation. They optimise for *content delivery* (a large library of videos and questions) rather than *practice consistency*. As a result, completion rates and long-term usage drop sharply after the first few sessions. There is a need for a platform that:

1. Treats the MCQ as the primary unit of interaction, not the lecture.
2. Embeds gamification — streaks, points, currency, leaderboards — directly into the practice flow.
3. Supports both *exam-targeted* learners (those preparing for a specific test on a specific date) and *subject-curious* learners (those who want to improve in one subject without a fixed exam in mind).
4. Scales gracefully so that leaderboards and stats remain fast even when usage grows.
5. Gives content authors and administrators a usable interface for adding subjects, units, exercises and questions, without depending on a developer for each update.

Locus is our attempt to address these needs in a single, coherent product.

## 1.3 Objectives of the Project

The objectives of this project, as agreed with the supervisor at the start of the academic year, were the following:

- **O1:** Design and build a mobile-first learning application supporting MCQ-style practice across multiple subjects and units.
- **O2:** Implement a gamification subsystem comprising XP, an in-app currency (Diamonds), a hearts-based lives system, and a daily streak counter, with all rewards processed atomically.
- **O3:** Implement an *asynchronous*, league-based leaderboard such that players are matched into fixed-size lobbies and competition begins only when the lobby is full, removing the unfairness of late joiners in a global season.
- **O4:** Build a backend service that exposes a clean REST API and is structured around domain modules (Auth, Courses, Gamification, Leaderboard, Admin, Jobs).
- **O5:** Build a Next.js admin console for content management, analytics and operational monitoring.
- **O6:** Use a *hybrid* database model — strict relational tables for hierarchy and flexible document storage for question payloads — so that the system can support new question types without schema migrations.
- **O7:** Demonstrate the system through a small pilot, gather feedback from real student users, and document findings, limitations and a future roadmap.

## 1.4 Scope of the Work

The scope of this capstone is a working, demonstrable system covering all the objectives above. It is not a commercial-grade product. In particular:

- The content seeded in the system covers a representative subset of subjects (Physics, Chemistry, Biology, Mathematics, Computer Science fundamentals, Python and C++) and a few units within each. It is enough to demonstrate the system, but a real launch would require curated content at much larger scale.
- The mobile build targets Android first, with iOS treated as a secondary target through Expo.
- Payment integration for purchasing Diamonds, push notifications, and email-based account recovery are designed for but not fully integrated; they are noted in the future work section.
- Security covers the essentials — bcrypt password hashing, JWT authentication, parameterised queries via Prisma, role-based admin access, input validation through DTOs — but a formal penetration test was outside the scope of the project.

## 1.5 Organisation of the Report

The remainder of this report is organised as follows. Chapter 2 reviews related literature and existing platforms to position Locus in the wider landscape of educational technology and game-based learning. Chapter 3 captures the system requirements, both functional and non-functional, and presents the use cases. Chapter 4 explains the system architecture and the rationale for the choice of technologies. Chapter 5 describes the database design, including the hybrid relational-document approach. Chapter 6 covers the implementation of each major module. Chapter 7 is dedicated to the gamification and leaderboard subsystem, which is the most novel part of the work. Chapter 8 describes the admin console. Chapter 9 reports on testing and quality assurance, while Chapter 10 discusses results from a small pilot. Chapter 11 lists the limitations honestly, and Chapter 12 draws conclusions and lays out a future roadmap.

---

# Chapter 2 — Literature Review and Background Study

## 2.1 The Rise of Mobile Learning

The shift from desktop-centred e-learning to mobile-first learning has been one of the defining trends of the last ten years. Several factors are responsible. First, the cost of smartphones in India has dropped to a point where a student in a tier-three city can own a device capable of running modern mobile apps. Second, mobile data prices since 2016 have made continuous internet access something a typical learner can afford. Third, the design language of mobile apps, particularly those produced by consumer technology companies, has trained users to expect quick, single-purpose interactions rather than long, structured sessions.

In academic literature, this shift is often discussed under the umbrella of *m-learning* (mobile learning). Researchers have noted that mobile learning is not simply desktop e-learning on a smaller screen. The constraints — small display, intermittent attention, touch input, frequent interruption — push designers towards micro-interactions: small chunks of content that can be completed in a few minutes. This *bite-sized* design approach is now standard in apps that explicitly target learners on the move.

For competitive examination preparation, however, much of the existing material has not adapted to these constraints. Many products still expect the user to sit through an hour-long video. The few that do offer practice-first interfaces tend to copy the structure of paper question banks: long quizzes with no immediate feedback, no progression, and no sense of momentum.

## 2.2 Game-Based Learning and Gamification

There is a useful distinction in the literature between *game-based learning* (where the learning content is delivered through a fully realised game, e.g., a physics simulation puzzle) and *gamification* (where game-like elements such as points, badges, streaks and leaderboards are added to a non-game activity). Locus belongs squarely in the second camp.

The idea of using points and badges to motivate behaviour is not new. The work of Deci and Ryan on intrinsic and extrinsic motivation suggests that external rewards must be deployed carefully — they can either support or undermine intrinsic interest, depending on context. In the case of MCQ practice for an exam, the learner already has strong extrinsic motivation (clearing the exam). The role of gamification here is therefore not to *create* motivation from nothing but to lower the daily activation energy required to start a session, and to provide micro-rewards along the way that make the session feel worthwhile.

Several large products have shown that this approach scales. Duolingo is the most cited example. Its streak feature has become almost iconic; users have been known to complete a one-minute session at midnight to keep a streak from breaking. Khan Academy uses a similar XP and badge system, although with less emphasis on social comparison. Kahoot! takes a different angle, treating the quiz itself as a multiplayer game in classroom settings.

A point that often comes up in reviews of these systems is the tension between *competition* and *learning*. A leaderboard that is too aggressive can demoralise weaker learners. One that is too soft has no motivational pull. The asynchronous lobby-based league system used in Locus is influenced by the design used in newer versions of Duolingo, where players are placed in fixed-size groups and are promoted or demoted based on relative performance within their cohort, rather than against the entire user base.

## 2.3 Spaced Repetition and Active Recall

Two ideas from cognitive psychology shape the long-term direction of Locus, even if not all of them are implemented in the current version. The first is *active recall* — the finding that retrieval practice (testing yourself) produces stronger long-term memory than passive review (re-reading notes). MCQ practice is, naturally, an active recall activity. The second is *spaced repetition* — the finding that recall is best when material is reviewed at increasing intervals over time. Tools like Anki implement this through the SM-2 algorithm.

The current Locus build does not implement true spaced repetition; exercises are delivered in the order chosen by the content author. A planned future module is a *Revision Queue* that schedules questions the learner has previously got wrong using a simplified spacing algorithm. This is discussed further in Chapter 12.

## 2.4 Survey of Existing Platforms

We surveyed several Indian and international platforms before settling on the Locus design. A brief, opinionated summary follows.

- **Unacademy / Byju's / Vedantu (India):** Strong content libraries, particularly for JEE and NEET. Heavy emphasis on live and recorded video. Practice tests exist but feel bolted on. Engagement loops are minimal.
- **Testbook / Adda247 (India):** Test-series oriented, strong for SSC, banking and railway exams. Practice flow is closer to what we wanted, but gamification is limited to a basic point system.
- **Duolingo (international):** The benchmark for engagement design. Of course, its content is language, not exam preparation, but the interaction patterns — the lesson tree, the heart system, the league — translate surprisingly well to MCQ practice.
- **Khan Academy (international):** Excellent free content, especially in mathematics. Light gamification. Practice exists but the interface is more web-first than mobile-first.
- **Brilliant (international):** Strong in interactive STEM lessons but built around a different pedagogical model (guided discovery rather than question banks).

The conclusion we drew was that there is genuine room for a product that combines (a) the mobile-first, gamified flow of Duolingo with (b) the subject coverage and exam orientation of the Indian preparation platforms. Locus is positioned in that gap.

## 2.5 Technical Background

A short note on the technical building blocks used. NestJS is a server-side framework for Node.js that organises code into modules, controllers and providers, in a style that will be familiar to anyone who has used Angular or, on the JVM, Spring. Prisma is an ORM that provides a typed query API generated from a schema file; it has become popular in the TypeScript ecosystem because it handles migrations and type safety in one place. PostgreSQL is the relational database; we use it both for relational tables and for JSON content. Redis is used as a cache and as the engine behind the leaderboard, where its Sorted Set data structure is exactly the right primitive for a ranking problem. React Native, through the Expo workflow, gives a single TypeScript codebase that runs on Android and iOS. Next.js powers the admin web console.

These are mainstream choices. We deliberately avoided picking exotic tools that might have looked impressive in a viva but would have made onboarding new developers harder. The aim throughout was to keep the project understandable to a team of two or three engineers who might inherit it later.

---

# Chapter 3 — System Analysis and Requirements

## 3.1 Stakeholders

Three stakeholders are central to the system.

The **learner** is the primary user. A typical learner is a college or senior school student preparing for one or more competitive exams, using a mid-range Android phone, often on a metered data connection. Their session lengths are short (5–15 minutes most days) but they may have longer sessions on weekends. They expect the app to remember their progress, to feel responsive, and to be honest about correctness — they do not want a "you got it!" message followed by the wrong answer being marked correct.

The **content administrator** is the person who curates subjects, units, exercises and questions inside the admin console. They are not a developer. Their interface needs to be clear and forgiving. Mistakes should be reversible.

The **system administrator** (often the same person as the content admin in our pilot) operates the deployment, monitors health, manages user accounts when needed, and reviews the analytics dashboards.

A fourth, indirect stakeholder is the **institution or coaching centre** that may eventually license the platform. Their concerns are reporting, scale and white-labelling. These concerns are noted but not fully addressed in the current build.

## 3.2 Functional Requirements

The functional requirements are summarised below.

**Table 3.1 — Functional requirements**

| ID | Requirement | Priority |
|---|---|---|
| F1 | Users can register and log in using email and password. | Must |
| F2 | New users go through an onboarding flow and choose either an exam target or a subject focus with a self-rated difficulty (1, 2 or 3). | Must |
| F3 | The home screen shows the user's current XP, Diamonds, Hearts, current league, and streak. | Must |
| F4 | Users can browse subjects, drill into units, and start an exercise. | Must |
| F5 | Each exercise consists of a sequence of questions of various types — MCQ, MATCH, REORDER, COMPLETE (fill-in-the-blank), TRANSLATE. | Must |
| F6 | On completing an exercise, the user is awarded XP, possibly Diamonds, and possibly a streak update. | Must |
| F7 | A wrong answer consumes one heart. Hearts regenerate over time and can be refilled with Diamonds. | Must |
| F8 | Users are placed into a leaderboard lobby of 12 players in their current league tier. The 10-day season starts only when the lobby fills. | Must |
| F9 | At season end, the top 5 are promoted, the middle 4 stay, and the bottom 3 are demoted. | Must |
| F10 | A 7-day streak rewards 150 Diamonds; completing a unit rewards 100 Diamonds. | Must |
| F11 | The admin can create, edit and delete subjects, units, exercises and questions. | Must |
| F12 | The admin can view per-user statistics and basic platform analytics. | Should |
| F13 | A daily background job resets streaks for inactive users and closes expired leaderboard groups. | Must |
| F14 | The system supports multiple time zones so that a "day" is defined by the user's local time. | Should |
| F15 | The admin console enforces a separate authentication path with elevated privileges. | Must |

## 3.3 Non-Functional Requirements

**Table 3.2 — Non-functional requirements**

| ID | Requirement | Target |
|---|---|---|
| N1 | Backend API latency, p95, for read-heavy endpoints | < 200 ms |
| N2 | Backend API latency, p95, for the exercise-complete endpoint | < 400 ms |
| N3 | Mobile cold-start time on a mid-range Android device | < 3 s |
| N4 | Leaderboard rank lookup | O(log N) per query |
| N5 | The system must handle at least 1,000 concurrent users in a load test without errors | 1,000 |
| N6 | Passwords stored only as bcrypt hashes (cost factor 10 or higher) | Must |
| N7 | All write endpoints validated through DTO classes with strict schema | Must |
| N8 | Database backups taken at least daily | Daily |
| N9 | The app must work offline at least to the extent of viewing previously loaded exercises | Should |
| N10 | The codebase must be documented well enough for a new developer to set it up in under one hour | Should |

## 3.4 Use Cases

Rather than reproduce every use case in long form, we describe a few representative ones below. A use case diagram is shown in Figure 3.1.

**UC-01 — Complete an Exercise.** A learner taps an exercise card on the unit screen. The mobile client requests the exercise payload from the backend, which returns a list of questions including the JSON content for each. The client renders each question one by one, capturing the user's response. When all questions are answered, the client posts the final result to `POST /exercise/complete`. The backend opens a transaction, computes the score, awards base XP and a possible perfect-score bonus, updates the streak, checks whether the unit is now fully completed (in which case Diamonds are awarded), updates league season XP if the user is in an active group, and returns a summary that the client uses to drive the celebration animation.

**UC-02 — Onboarding by Exam.** A new user signs up. After the welcome screen, they are asked whether they are preparing for a specific exam. They pick "JEE 2026" and provide the exam date. The backend stores a `UserExamEnrollment` row. The home screen is then configured to show the subjects associated with that exam, in their canonical order.

**UC-03 — Onboarding by Subject.** Another new user picks the subject path instead. They choose Physics and self-rate as "Pro" (level 2). The backend stores a `UserSubjectEnrollment` row with `difficulty = 2`. The home screen now defaults to Physics 2 (intermediate level) and shows its units.

**UC-04 — Lose all Hearts.** During a session, a user gets five questions wrong. Their hearts go from 5 to 0. The next answer attempt is blocked and the client offers them either to wait for hearts to regenerate (one heart every 30 minutes) or to spend 10 Diamonds to refill one heart immediately.

**UC-05 — Promotion at Season End.** A user finishes the 10-day season ranked third in their league tier 4 group. The job worker, when it processes the closed group, marks the user as promoted to tier 5. On the next app open, the home screen shows a promotion celebration and the new league badge.

## 3.5 Constraints and Assumptions

The system is built under the following assumptions:

- Users have an internet connection during practice sessions. Limited offline support is planned but not in the current scope.
- The mobile target is Android first; iOS is supported through Expo but has not been extensively tested.
- The single PostgreSQL instance and single Redis instance used in the pilot are sufficient for the load levels seen during the project. Horizontal scaling is discussed in Chapter 12.
- All times are stored in UTC in the database; the user's time zone is used at the application layer for streak calculations and similar date-sensitive logic.

---

# Chapter 4 — System Design and Architecture

## 4.1 High-Level Architecture

Locus is a three-tier system composed of three independently deployable codebases, all communicating over HTTP(S):

1. The **mobile client**, written in TypeScript using React Native (Expo). It is the primary surface for learners.
2. The **admin console**, written in TypeScript using Next.js. It is the surface for content administrators.
3. The **backend API**, written in TypeScript using NestJS. It owns all business logic and is the only component that talks to the database. Both the mobile and the admin console are clients of this API.

PostgreSQL is the persistent store. Redis is used as a cache and, more importantly, as the storage layer for live leaderboard rankings via Sorted Sets. A simple cron-based job runner inside NestJS handles the periodic tasks: resetting streaks at midnight, closing expired leaderboard groups, and refilling hearts on a schedule.

This layout is deliberately conservative. We considered a microservices split early on — for example, peeling off the leaderboard as a separate service — but decided against it. The team is small, the domain is bounded, and the operational complexity of multiple services would have eaten into time better spent on product features. Where we *do* split, it is at the *deployable* boundary (mobile, admin, backend) which is forced by the platforms themselves, and not at every domain boundary.

## 4.2 Backend Module Layout

Inside the NestJS backend, the code is organised by *bounded context* rather than by technical layer. The top-level `src/` directory contains:

- `auth/` — sign-up, sign-in, JWT issuance and verification, the Passport JWT strategy and the auth guard.
- `users/` — user profile and account-level operations.
- `courses/` — subjects, units, exercises and questions; read models for the catalogue.
- `gamification/` — XP and Diamond awards, the hearts utility, the streak utility, and the rewards constants.
- `leaderboard/` — placement into lobbies, season XP updates, promotion and demotion.
- `admin/` — admin-only controllers, the admin guard, and the DTOs used for content management.
- `jobs/` — the daily worker that closes seasons, resets streaks and refills hearts.
- `prisma/` — the Prisma client wrapped as an injectable module.
- `redis/` — the Redis client wrapped similarly.

Each module exposes its capabilities through a `Service` class and consumes them through controllers. This pattern, while sometimes accused of being verbose, has the practical benefit that the *unit of testing* is the service: a controller is thin enough that the meaningful tests live one layer down.

## 4.3 The Mobile Client

The mobile client is built with Expo, which simplifies the React Native build pipeline considerably and gives access to managed native modules without ejecting. The app is organised into the following top-level routes (using Expo Router):

- `auth.tsx` — sign in / sign up.
- `onboarding.tsx` — exam vs subject selection and difficulty.
- `(tabs)/` — the main bottom-tab navigation containing Home, Subjects, Leaderboard, Profile.
- `exercise/` — the fullscreen exercise player.
- `shop.tsx` — Diamond store.
- `streak.tsx` — streak details.

A small `api/` layer wraps `fetch` and adds the Authorization header, while a `context/` directory holds React contexts for the user session and the theme.

## 4.4 The Admin Console

The admin console is a Next.js application using the App Router and Tailwind CSS for styling. Pages live under `app/(console)/` and are protected by a middleware that checks for an admin session cookie. Reusable components — page headers, pagination, row actions, the sidebar — live in `components/`. A small client-side API helper (`lib/client-api.ts`) and a server-side admin API helper (`lib/admin-api.ts`) keep the network code in one place.

The admin console is not just a CRUD form generator. It also surfaces analytics — daily active users, exercise completion counts per subject, average score per exercise — which proved essential during the pilot for spotting questions that were either trivially easy or unintentionally impossible.

## 4.5 Technology Stack and Rationale

**Table 4.1 — Technology stack and rationale**

| Layer | Choice | Why we chose it |
|---|---|---|
| Mobile | React Native + Expo (TypeScript) | One codebase for Android and iOS, fast iteration via Expo Go, large ecosystem of community modules. |
| Admin | Next.js 14 + Tailwind CSS | Server components and the App Router for clean data fetching, Tailwind for fast UI work. |
| Backend | NestJS (TypeScript) | Strong module boundaries, dependency injection, mature ecosystem for guards, pipes and validation. |
| ORM | Prisma | Schema-first migrations, type-safe queries, good developer experience. |
| Primary DB | PostgreSQL | Mature, supports JSON columns, ACID guarantees needed for reward transactions. |
| Cache / Ranking | Redis | Sorted Sets are exactly the right primitive for live leaderboard ranking. |
| Auth | JWT (access tokens) + bcrypt | Simple, stateless, well-understood. |
| Deploy | Docker + docker-compose | Reproducible, easy to spin up the whole stack with one command. |

We considered alternatives at most of these layers. Flutter was on the table for mobile — its UI is arguably smoother — but the team's existing TypeScript experience tipped the choice towards React Native. Express was considered for the backend; NestJS was chosen because the structural conventions it imposes pay off the moment the codebase grows beyond a few thousand lines. MongoDB was considered for the question store, attractive because of its schema flexibility; PostgreSQL with a JSON column gave us the same flexibility while keeping referential integrity for the rest of the data model.

## 4.6 Deployment

In the pilot, the entire stack runs on a single virtual machine via `docker-compose`. The compose file declares three services: the NestJS backend, a PostgreSQL container, and a Redis container. The admin console is deployed as a separate Next.js app, fronted by Nginx. The mobile app is built into an APK using EAS (Expo Application Services) and side-loaded onto pilot devices. A simple `deploy.sh` script handles `git pull`, Prisma migrations, and a controlled restart.

For production, we would split the database off to a managed service, run the API behind a load balancer with two or three instances, and use a managed Redis. None of this requires architectural changes — it is just an operational upgrade.

## 4.7 Security Considerations

Security was treated as a baseline, not as a feature added at the end. Some of the measures in place:

- Passwords are stored as bcrypt hashes with a cost factor of 10. The plain-text password never leaves the API request body and is not logged.
- The JWT access token is signed with an HMAC secret loaded from environment variables. Tokens expire after a fixed window; refresh logic is documented but not yet implemented in the current build.
- All write endpoints accept input only through DTO classes annotated with `class-validator` decorators. The global validation pipe rejects unknown fields and malformed types before the controller is even reached.
- Prisma is used for every database operation, which means raw SQL is rare and is parameterised when used. SQL injection is therefore not a concern in the normal code paths.
- The admin API is gated behind a separate `AdminGuard` that checks both the JWT *and* a server-side admin role flag.
- CORS is configured to allow only the known origins of the mobile and admin clients in production.
- Environment files containing database URLs and secrets are excluded from version control via `.gitignore` and rotated on each deployment.

These are the OWASP-style basics. A formal security review remains future work.

---

# Chapter 5 — Database Design and Data Modelling

## 5.1 Design Philosophy

The data model follows the *hybrid relational–document* pattern described in our internal design note (`Helper/Scalable MCQ App Database Architecture.md`). The educational hierarchy and gamification state are modelled relationally, where joins are predictable and integrity matters. The actual *content* of a question is stored as a JSON-encoded payload in a single column, which means the schema does not need to change every time we add a new question type.

The schema is implemented in Prisma. We chose Prisma over hand-written SQL migrations because the team's day-to-day workflow benefits from generated types. When we change a field, the generated client refuses to compile in places where the old field was used; this turned out to catch several silent bugs during development.

## 5.2 Educational Hierarchy

The hierarchy is **Subject → Unit → Exercise → Question**. A subject like Physics exists at three levels (foundation, intermediate, advanced), each represented as a separate Subject row, distinguished by the `level` field and a `displayName` such as *Physics 1*, *Physics 2* or *Physics 3*. This is a slightly unusual choice. We could have modelled level as a separate dimension of a single Physics subject, but doing so would force every screen and every API call to disambiguate. Treating each level as a distinct Subject keeps the API simple — "give me the units of Subject X" — and avoids accidentally mixing easy and hard content in the same lesson tree.

A Unit belongs to a Subject and has an `orderIndex` that controls display order. An Exercise belongs to a Unit and has a duration (in minutes), a base point value (which feeds into the XP reward), and its own `orderIndex`. A Question belongs to an Exercise, has a `type`, a `prompt`, a difficulty level, a points value, a JSON `content` blob, and an optional `explanation`.

```
Subject (id, slug, name, level, displayName, icon, description)
   └── Unit (id, subjectId, title, orderIndex, description)
         └── Exercise (id, unitId, title, duration, points, orderIndex)
               └── Question (id, exerciseId, type, prompt, difficulty, points, content, explanation)
```

The `(name, level)` combination is unique on Subject so that we cannot accidentally create two "Physics 2" rows. Foreign keys cascade on delete; if a Unit is removed, its Exercises and Questions go with it. This is appropriate because there is no use case where a Question survives its parent Exercise.

## 5.3 Exam Integration

Exams are a separate first-class concept, joined to subjects through the many-to-many table `ExamSubject`. This lets a single Subject (say, Physics 2) appear under multiple Exams (JEE 2026, NIMCET 2026) without duplication. The join row carries an `orderIndex` so that an exam can present its subjects in a chosen order — for example, Mathematics first for engineering exams.

```
Exam (id, slug, title, description)
ExamSubject (examId, subjectId, orderIndex)
```

## 5.4 Onboarding Enrollments

Onboarding produces a row in either `UserExamEnrollment` (for users who picked an exam target and a date) or `UserSubjectEnrollment` (for users who picked a subject and a difficulty rating of 1, 2 or 3, mapping to *enjoy*, *pro*, *expert*). The two tables are intentionally separate so that the constraints are clean: an exam enrollment requires an exam and an exam date; a subject enrollment requires a subject and a difficulty integer. Forcing both kinds of choices through one polymorphic table would have produced an awkward schema with optional fields on both sides.

A single user may have multiple subject enrollments (someone preparing across Physics, Chemistry and Maths), but only one enrollment per (user, subject) pair. This is enforced by a unique constraint.

## 5.5 Gamification State

The `UserStats` table stores per-user gamification state. It is a one-to-one extension of the `User` table. The fields are:

- `totalXp` — lifetime XP, used for the lifetime profile but *not* for the active league competition.
- `diamonds` — current Diamond balance.
- `hearts` — current heart count, between 0 and `MAX_HEARTS` (5).
- `lastHeartRefillAt` — timestamp anchor used by the heart regeneration logic. It is `null` when hearts are full.
- `currentLeagueIndex` — integer between 1 and 30 indicating the user's current league tier.
- `currentStreak` — current streak in days.
- `longestStreak` — best streak the user has ever achieved.
- `lastActivityDate` — date (in UTC) of the most recent qualifying activity. Used by the streak update logic.

Each completed exercise produces an `ExerciseAttempt` row with the score, XP awarded, Diamonds awarded, and a boolean `isPerfect`. This table is the analytics backbone — almost every dashboard in the admin console comes from queries against it. Diamond changes are also recorded in a separate `DiamondLedger` table, so that the balance can always be reconstructed. This redundancy is worth the storage cost; debugging a "where did my Diamonds go" complaint without a ledger is a frustrating exercise.

## 5.6 Leaderboard Schema

The leaderboard schema has only two tables, but the behaviour around them is involved (see Chapter 7).

```
LeaderboardGroup (id, leagueTier, state, capacity, filledCount, startedAt, endsAt, createdAt)
LeaderboardParticipant (id, groupId, userId, seasonXp, joinedAt, lastXpAt)
```

A `LeaderboardGroup` represents a single 12-player lobby in a specific league tier. It has a state of `WAITING`, `ACTIVE` or `CLOSED`. Once the 12th participant joins, the state transitions to `ACTIVE`, `startedAt` is set to the current time, and `endsAt` is set to ten days later. A daily job sweeps for groups with `state = 'ACTIVE'` and `endsAt < now`, and closes them.

A `LeaderboardParticipant` row links a user to a group and stores their `seasonXp` — XP earned *during* the active period of that group. This is the value used for ranking; it is *not* the same as `UserStats.totalXp`.

For the live ranking itself, we also maintain a Redis Sorted Set per group, keyed `leaderboard:{group_id}`. The score is the user's `seasonXp`, the value is the user's id. This gives us O(log N) inserts and updates and instant rank retrieval. The PostgreSQL row is the authoritative copy; Redis is a fast read replica that is rebuilt from PostgreSQL if it is ever lost.

## 5.7 Indexing and Query Patterns

Indexes are added on every foreign key (`Unit.subjectId`, `Exercise.unitId`, `Question.exerciseId`, etc.) and on a few composite columns where the access pattern justifies it. Notable composite indexes:

- `ExerciseAttempt(userId, createdAt)` — used to fetch a user's recent activity.
- `LeaderboardGroup(leagueTier, state)` — used by the placement query, which always asks "any waiting group in tier T?".
- `DiamondLedger(userId, createdAt)` — used by the ledger view in the profile screen.

Most read queries are well within sub-millisecond range on the pilot data set; the indexes make the schema future-proof for a larger user base. The largest table by far is expected to be `ExerciseAttempt`. At a million users completing two exercises a day, that table grows by two million rows a day. Long-term, partitioning by month is the right strategy. We have not implemented partitioning in the current build.

## 5.8 Data Integrity and Transactions

Every reward computation runs inside a single Prisma transaction. The transaction scope includes: incrementing `UserStats.totalXp`, conditionally updating `UserStats.currentStreak`, conditionally writing to `DiamondLedger`, conditionally incrementing `UserStats.diamonds`, and creating an `ExerciseAttempt` row. The Redis write to update the leaderboard sorted set happens *after* the database commit. If the Redis call fails, the database is still consistent, and the next read will repopulate Redis from the truth in PostgreSQL.

This *transactional inside, eventually consistent outside* pattern is a deliberate choice. It avoids the worst kind of bug in a gamified system, which is when a user is told they earned XP and Diamonds but the balance does not actually move because some part of the multi-step process failed silently.

---

# Chapter 6 — Implementation

## 6.1 Backend Implementation Notes

The backend is structured as one NestJS application. Each domain module exports one `Service` and one or more `Controller`s. The `PrismaService` and `RedisService` are provided as global injectables so that any module can ask for them in its constructor.

A typical request flow looks like this. The mobile client calls `POST /exercise/complete` with a payload containing the exercise id, an array of question results (`questionId` and either `correct: true` or `correct: false`), and the elapsed time. The request hits the `ExerciseController`, which is protected by `JwtAuthGuard`. The guard extracts the user id from the verified token and attaches it to the request object. The controller then calls `gamificationService.completeExercise(userId, dto)`, which is where the real work happens. The service opens a transaction, computes the score, awards XP, updates the streak (using `streak.util.ts`), checks for unit completion, awards Diamonds where applicable, writes the ledger entry, creates the `ExerciseAttempt` row, and finally returns a structured result. The controller serialises this back as JSON.

A point worth noting: the controller does *not* call any Prisma or Redis method directly. Keeping the controller thin makes the service unit-testable in isolation, and it also makes it possible to expose the same behaviour via a different transport (e.g., GraphQL) later, by adding a new controller that calls the same service.

## 6.2 Authentication

Authentication uses email and password, with bcrypt hashing on the server. The `AuthService` exposes two methods: `signUp(dto)` and `signIn(dto)`. The first creates a User row, hashes the password, and returns a freshly issued JWT. The second looks up the User by email, compares the hash, and returns a JWT on success.

The JWT carries the user id and an issued-at timestamp; we deliberately keep the payload small. Token verification uses Passport's JWT strategy. The `JwtAuthGuard` is attached at the controller level for all protected routes.

A separate `AdminGuard` checks both the JWT *and* an `isAdmin` flag, which is set by an admin manually for now. In production this flag would be promoted into a roles table.

## 6.3 Courses and Catalogue

The `CoursesService` exposes read operations for the catalogue: `listSubjects`, `getSubject(slug)`, `listUnits(subjectId)`, `getExercise(id)`, and so on. These endpoints are heavily read-cached because the catalogue changes infrequently. A simple in-memory cache with a 60-second TTL was enough for the pilot; for a production deployment, we would put a CDN or Redis cache in front.

Write operations on the catalogue are *not* exposed to the mobile client; they live entirely on the admin side and are protected by `AdminGuard`.

## 6.4 Gamification Service

The `GamificationService` is the heart of the platform. The most important method is `completeExercise`, which we describe in pseudo-code below to keep the report self-contained. The actual TypeScript implementation lives in `backend/src/gamification/gamification.service.ts`.

```
function completeExercise(userId, dto):
  start a database transaction
    fetch the exercise with its questions
    compute correctCount / totalCount based on dto.answers
    scorePct = round((correctCount / totalCount) * 100)
    isPerfect = (scorePct == 100)

    xp = REWARDS.EXERCISE_BASE_XP             // 20
    if isPerfect: xp += REWARDS.PERFECT_SCORE_BONUS_XP   // +5

    diamondsAwarded = 0
    if this completion finishes the parent unit:
      diamondsAwarded += REWARDS.UNIT_COMPLETION_DIAMONDS  // 100

    streakResult = updateStreak(userId, today, userTimezone)
    if streakResult.newStreak % 7 == 0 and streakResult.changed:
      diamondsAwarded += REWARDS.STREAK_7_DIAMONDS  // 150

    increment UserStats.totalXp by xp
    increment UserStats.diamonds by diamondsAwarded
    insert into ExerciseAttempt(...)
    if diamondsAwarded > 0: insert into DiamondLedger(...)

    if user is in an ACTIVE leaderboard group:
      participant.seasonXp += xp
      enqueue Redis ZADD operation for after-commit
  commit

  if any Redis operation was enqueued: execute it now
  return summary { xp, diamonds, scorePct, isPerfect, streak: streakResult, leagueProgress: ... }
```

There are a few subtleties worth highlighting. The streak update uses `streak.util.ts`, which compares `lastActivityDate` to today in the user's timezone — not in UTC. If we used UTC, a user in IST who studies at 11 PM local time and then again at 6 AM the next morning would lose their streak because the UTC date had only advanced by a few hours. The timezone is stored on the User row and defaults to UTC for users we cannot detect.

The unit completion check is implemented as a query that counts the number of distinct exercises in the parent unit and compares it to the number of distinct exercises the user has at least one *passing* attempt for. *Passing* here means a score of at least 60 percent; this threshold is currently hard-coded but will be moved to the rewards constants file.

## 6.5 Hearts Subsystem

The hearts subsystem is implemented in `hearts.util.ts`. The rules are:

- Each user starts with 5 hearts.
- A wrong answer in an exercise consumes one heart. Right answers do not change hearts.
- Hearts regenerate at one heart every 30 minutes.
- A user can spend 10 Diamonds to refill one heart on demand.
- Hearts are capped at 5.

Regeneration is computed lazily. We do *not* run a per-user timer. Instead, on every read of `UserStats`, we compute the number of hearts the user *should* have based on `lastHeartRefillAt` and `now`, clamp to the maximum, and persist any change. This makes the system stateless from the worker's point of view.

A nightly worker also walks all users with `hearts < MAX` and `lastHeartRefillAt < now - regen_interval` to ensure that even users who do not log in for a long time eventually get refilled. This is more for analytical cleanliness than for correctness.

## 6.6 Streak Subsystem

`streak.util.ts` exposes a single function: `updateStreakOnActivity(stats, today, timezone)`. The cases are well-known and straightforward:

1. If `lastActivityDate == today` (user already practiced today), do nothing.
2. If `lastActivityDate == yesterday`, increment the streak by 1.
3. If `lastActivityDate < yesterday` (a day was skipped), reset the streak to 1.
4. If `lastActivityDate` is null (first ever activity), set the streak to 1.

A daily job runs at 00:01 UTC and walks users for whom the *local* date has crossed into a new day, resetting `currentStreak` to zero where activity was missed. The job is idempotent: running it twice does no harm because it only writes when the streak is currently above zero and the day was indeed missed.

## 6.7 Mobile Implementation Notes

The mobile client uses Expo Router for navigation. The interesting parts are the exercise player (`app/exercise/[id].tsx`), which renders different question types through a switch on `question.type`, and the home screen, which subscribes to a `UserStatsContext` to keep the XP, Diamonds, Hearts and streak counters in sync after a session.

A notable engineering decision was to keep the exercise *answers* in local state until the very end, posting them to the backend in one shot. We initially considered an "answer per tap" pattern with an immediate API call after every question. That would have given finer analytics, but it would also have made the experience fragile on flaky networks. Sending the whole result at the end is simpler, faster from the user's perspective, and only sacrifices the ability to record partial sessions — an acceptable trade.

The UI uses a custom theme (defined under `mobile/src/theme/`) with a small set of typography and colour tokens. A reusable card component is used everywhere from the home screen to the league screen so that the visual language stays consistent.

## 6.8 Admin Console Implementation Notes

The admin console pages are server components in Next.js. Data fetching happens at the page level using a small `admin-api.ts` helper that wraps `fetch` with the admin token. Forms (for editing a Subject, a Unit, an Exercise, a Question) use React Hook Form with a Zod schema for client-side validation; the same DTO classes on the backend re-validate everything before writing.

The most useful screen during the pilot turned out to be the *Question Editor*. It renders a JSON editor for the `content` field with a small live preview that mimics the mobile rendering. Several content authors caught their own mistakes in the preview before saving — a small feature that paid for itself many times over.

---

# Chapter 7 — The Gamification and Leaderboard Subsystem

## 7.1 Why a Separate Chapter

The gamification logic is the most novel and most error-prone part of the system, so we devote a full chapter to it. Most bugs we hit during development came from this subsystem. Most user delight came from it too.

## 7.2 The Reward Model

The reward constants live in `backend/src/gamification/rewards.constants.ts`. We keep them in code rather than in the database because tuning them is a developer-controlled action and we want every change to go through code review. The current values, summarised:

**Table 6.1 — Reward constants**

| Constant | Value | Notes |
|---|---|---|
| `EXERCISE_BASE_XP` | 20 | Awarded for each completed exercise. |
| `PERFECT_SCORE_BONUS_XP` | 5 | Added on a 100 % score. |
| `UNIT_COMPLETION_DIAMONDS` | 100 | Awarded once per unit, the first time it is fully cleared. |
| `STREAK_7_DIAMONDS` | 150 | Awarded on every 7th day of an active streak (7, 14, 21 …). |
| `HEARTS.MAX` | 5 | Maximum hearts. |
| `HEARTS.REFILL_COST_DIAMONDS` | 10 | Cost in Diamonds to refill one heart. |
| `HEARTS.REGEN_INTERVAL_MS` | 1,800,000 | One heart every 30 minutes. |
| `LEAGUE.GROUP_SIZE` | 12 | Players per leaderboard lobby. |
| `LEAGUE.SEASON_DAYS` | 10 | Days an active season runs. |
| `LEAGUE.PROMOTION_TOP` | 5 | Top 5 promote at season end. |
| `LEAGUE.DEMOTION_BOTTOM` | 3 | Bottom 3 demote (if not at minimum tier). |
| `LEAGUE.MIN_TIER` | 1 | No demotion below this. |
| `LEAGUE.MAX_TIER` | 30 | No promotion above this. |

These numbers are not magic. They were picked by looking at what felt good in early playtesting. Twenty XP per exercise lets a casual user earn enough in a single short session to feel meaningful progress on the XP bar, while still requiring real consistency to climb a league. The five-XP perfect-score bonus is small enough not to discourage attempts at hard content (the user does not feel cheated for getting 90 %), but big enough to incentivise care.

## 7.3 The XP Bar and Levels

XP is the simplest reward. It accumulates monotonically over the user's lifetime in `UserStats.totalXp`. A simple level mapping (currently every 1,000 XP equals one profile level) is computed on the client; it does not need to be stored. Levels do not gate any content; they are a pure progress indicator. Locking content behind an XP gate was discussed and rejected — we did not want to penalise the casual learner who only has 15 minutes a day.

## 7.4 The Diamond Currency

Diamonds are the in-app currency. They are earned through unit completion bonuses and the 7-day streak bonus, and they are spent on heart refills. A planned future revenue source is direct purchase of Diamonds through an in-app payment, but this is out of scope for the pilot.

Every Diamond movement — earn or spend — produces a row in the `DiamondLedger`. The current balance in `UserStats.diamonds` is the running total of the ledger. Storing both the running total *and* the ledger looks redundant, but it makes the read path fast (no aggregation needed for the home screen) while still allowing reconstruction of how a user reached their current balance.

## 7.5 The Hearts Lives System

Hearts are a soft difficulty mechanism. They cap how many wrong answers a user can make in a short window before being asked to either wait or spend Diamonds. Without hearts, an unmotivated user could click randomly through questions; the heart system gives the small consequence that this is *expensive*.

The hearts UI on the mobile client shows five small icons in the top-right of every exercise screen. A wrong answer triggers a heart-loss animation. When hearts hit zero, the exercise screen shows a modal with two options: wait (with a live countdown), or refill for ten Diamonds. The refill action calls `POST /gamification/hearts/refill`, which atomically decreases Diamonds and increases hearts.

## 7.6 The Daily Streak

The streak counter is the single feature most discussed by pilot users, both positively and negatively. Positively, users reported that the small fear of breaking a streak got them to open the app on days they would otherwise have skipped. Negatively, two users reported the classic streak-anxiety problem: they had built up a 28-day streak and one missed day made the streak reset to zero, which felt punishing.

For now we have not implemented streak freezes — the Duolingo-style mechanism where the user can spend currency to forgive a missed day — but this is a clear early addition. The hooks for it are already in place in the streak utility; only the UI and the Diamond cost need to be added.

The state diagram of the streak update is shown in Figure 7.2. The transitions are:

```
[no activity yet]  --first activity-->  [streak = 1]
[streak = N]  --activity on next day-->  [streak = N + 1]
[streak = N]  --activity on the same day-->  [streak = N]   (no change)
[streak = N]  --activity skipping a day-->  [streak = 1]
[streak = N]  --no activity, daily worker runs-->  [streak = 0]
```

## 7.7 The Asynchronous League

The leaderboard is the most architecturally interesting feature. A naive design — "everyone plays in the same season, the top players are promoted, repeat" — has two well-known problems: late joiners are at a disadvantage because they have less time to earn XP, and sufficiently large user bases make the leaderboard impersonal because the top spots are dominated by a small group of power users.

We adopted an *asynchronous lobby* model, inspired by similar designs in modern Duolingo and competitive mobile games. The state machine of a leaderboard group is shown in Figure 7.1.

```
                      user joins, group fills < 12
                              ┌───────────┐
                              │           │
                       ┌──────┴──────┐    │
                       │  WAITING    │────┘
                       └──────┬──────┘
                              │ 12th user joins
                              ▼
                       ┌─────────────┐
                       │  ACTIVE     │
                       │  10-day     │
                       │  countdown  │
                       └──────┬──────┘
                              │ endsAt < now (daily worker)
                              ▼
                       ┌─────────────┐
                       │  CLOSED     │
                       │  ranks      │
                       │  applied    │
                       └─────────────┘
```

The placement rule is: when a user completes their first exercise after their previous group has closed, the system looks for any group in their current league tier with `state = WAITING`. If one exists with fewer than 12 members, the user is added; otherwise, a brand-new group is created with this user as its first member. While a group is `WAITING`, XP earned by its members does *not* count toward `seasonXp`. The UI tells the user they are waiting and shows the current fill (for example, "Waiting for opponents (5/12)").

When the 12th user joins, the group transitions to `ACTIVE`. From that exact moment, every XP increment to a member also bumps `seasonXp`. Internally, this happens inside the same transaction as the XP award (Section 6.4). After the transaction commits, the Redis Sorted Set for that group is updated, so the live ranking is always accurate.

A daily worker (defined in `backend/src/jobs/jobs.service.ts`) sweeps for groups with `state = ACTIVE` and `endsAt < now`. For each such group, it ranks the participants by `seasonXp` (with the tie-break rule: earlier `lastXpAt` wins ties), applies the promotion / safe / demotion bands, and writes the new `currentLeagueIndex` to each user's `UserStats`. The group is then transitioned to `CLOSED`. New activity by these users will cause them to be placed into a new `WAITING` group at their (possibly updated) tier on the next exercise complete.

**Table 7.1 — League promotion / demotion zones**

| Position in group (after season ends) | Outcome |
|---|---|
| 1 – 5 (top 5) | Promoted to next tier (capped at 30) |
| 6 – 9 (middle 4) | Stay in current tier |
| 10 – 12 (bottom 3) | Demoted to previous tier (floored at 1) |

The advantage of this design is that every user's season is fair: it lasts ten days, no matter when they joined. The cost is a more complex placement query and the small window during which users feel they are "just waiting". In practice, the waiting window is short — at our pilot scale a group typically fills within a few hours of being opened — and on the few occasions when waiting was longer, users still earned XP toward their lifetime total, which softened the wait.

## 7.8 Why Redis for Ranking

The ranking is read constantly, on every leaderboard screen view. Computing rank in PostgreSQL would be possible (with a window function over the participants of a group), but every read would be a sort over up to twelve rows. That is fine at twelve rows, but over many groups it is wasteful, and it does not give us a clean way to do "rank changed" notifications. Redis Sorted Sets give us exactly the operations we need: `ZADD`, `ZINCRBY`, `ZREVRANK`, and `ZREVRANGE WITHSCORES`. Each is O(log N) and the keys are independent, so sharding by tier (or by group, in our case) is trivial if we ever need to scale out.

PostgreSQL remains the source of truth. If Redis is wiped, a small bootstrap routine reads `LeaderboardParticipant` rows and rebuilds the sorted sets. We tested this in development by deliberately flushing Redis in front of a running app, and the leaderboard recovered without any user-visible damage.

## 7.9 Dealing with Edge Cases

A handful of edge cases are worth calling out, because they took disproportionate time to get right.

- **A user enrolls in a new exam mid-season.** The placement is keyed on `currentLeagueIndex`, not on exam, so the existing season is unaffected.
- **The 12th user joins the lobby exactly when the daily worker is running.** Both operations want the row. We use `SELECT ... FOR UPDATE` (via Prisma's `interactiveTransactions`) on the group row to serialise the two writers.
- **A user completes an exercise *after* their group has been closed but *before* a new group exists for them.** The completion still awards XP to the lifetime total; the placement happens inline as part of the same request, opening (or joining) a new `WAITING` group.
- **A user's tier changes between the time the group closed and the time they next play.** The new placement uses the new tier, so promotions and demotions are immediately reflected.
- **Tied scores.** Ties are broken by the earlier `lastXpAt`. Users who reached the score first are ranked higher, which feels fair and also avoids the embarrassment of two users sharing the same rank visibly on a small leaderboard.

## 7.10 Discussion

The asynchronous league design is more code than a global season would have been, but the user-facing benefit is clear. Every player gets the same season length. There is no sense of being a latecomer. Promotion and demotion feel deserved because the comparison is always against twelve people who started at the same moment.

If we were starting again, we would consider one refinement. Right now, all twelve players in a lobby are treated as anonymous to one another (only display name and XP are shown). Adding a small profile peek — "this player is at level 12, has a 30-day streak, plays mostly Physics" — would make the competition feel a little more human. We did not include this in the pilot for privacy reasons, but it could be made opt-in.

---

# Chapter 8 — Admin Console and Content Operations

## 8.1 Why a Custom Admin Was Necessary

We considered using a general-purpose admin tool such as Retool, Forest Admin or even raw `psql` for the back-office work. Each had issues. A general-purpose admin would not understand our JSON `content` field; an SQL console would put content authors at risk of writing destructive queries; both would lock the project into a vendor or a particular workflow. A custom Next.js console gave us exactly the screens we wanted and let us layer on validation and previews where they mattered.

## 8.2 Information Architecture

The console is organised into three top-level sections.

**Catalogue.** Lists subjects, units, exercises and questions. Each entity has its own create / edit / delete form, with a JSON editor for the question content field, supported by a live preview that renders the question the way the mobile client would.

**Users.** Lists registered users with filters by sign-up date, league tier and recent activity. A single-user view shows lifetime XP, current streak, recent attempts and Diamond ledger entries — the same information that exists on the user's own profile screen, but for the admin.

**Operations.** Shows system health (database connection, Redis connection, last successful job run), platform-level analytics (daily active users, exercises completed per day, average score per subject), and quick operational actions (close a stuck leaderboard group, reset a user's hearts).

## 8.3 A Note on Author Workflow

During the pilot we observed that authors developed their own informal workflow around the admin: write a few questions in a shared spreadsheet, paste them one by one into the console, use the live preview to spot errors, mark the exercise as published, then test it on a phone. This is slower than a bulk import would be, but it caught a remarkable number of errors that bulk import would have hidden. A bulk-import tool is in the backlog but has not been built; the pilot's content volume did not yet require it.

---

# Chapter 9 — Testing and Quality Assurance

## 9.1 Testing Strategy

Testing on a project of this size is a balancing act. Writing exhaustive tests for every endpoint is unrealistic in a single semester; writing none is irresponsible. We chose a *risk-weighted* approach: heavy tests on the gamification logic, lighter tests on CRUD endpoints, manual QA on the mobile UI.

The gamification service has unit tests for the XP calculation, the streak update, the heart regeneration and the league placement. These tests use an in-memory PostgreSQL via Docker and a fresh Prisma schema for isolation. A typical streak test walks through several days of simulated activity and asserts the streak counter behaves correctly across all four cases listed in Section 6.6.

The auth flow has integration tests that spin up the application context, hit `POST /auth/signup` and `POST /auth/signin` with valid and invalid payloads, and assert the responses. The catalogue endpoints have a smaller set of integration tests that verify the seeding script produces the expected hierarchy.

The mobile client was tested manually on three pilot devices — two Android phones and an iPhone via TestFlight. We did not write component tests for the React Native side; given the time budget, manual walkthroughs of the main flows were a better use of our hours.

## 9.2 Load Testing

We ran a small load test using `k6` against a local deployment. The scenario simulated 1,000 concurrent virtual users, each completing one exercise per minute for ten minutes. The backend held up well: median latency for `POST /exercise/complete` stayed at around 80 ms and the p95 stayed under 250 ms. PostgreSQL and Redis CPU usage were both modest. We did not attempt to load test beyond this, partly because the single-VM pilot deployment would have hit its own limits well before the application logic did.

## 9.3 Bug Highlights

Three bugs from development are worth recording, because they each taught a small lesson.

**Bug 1: Streak off by one on timezone boundary.** Early versions of the streak check used `new Date()` everywhere, implicitly UTC. A pilot user in IST broke their own streak by studying late at night. Fix: pass the user's timezone into the streak comparison and compare *local* dates, not UTC dates. Lesson: dates are not numbers; never compare them naively.

**Bug 2: Double-spend on heart refill.** A user with exactly 10 Diamonds tapped the *Refill* button twice quickly on a slow network. Both requests reached the server, both checks passed (each saw 10 Diamonds), one of them produced a negative balance. Fix: wrap the refill in a transaction with a `WHERE diamonds >= cost` clause on the update, so the second one fails atomically. Lesson: optimistic clients meet pessimistic servers.

**Bug 3: Stuck `WAITING` group.** During a quiet period, a `WAITING` group sat half-full for two days. New users were being assigned to a *different* `WAITING` group in a different tier (because their tier had changed). The first group simply never filled. Fix: add a `staleness` check in the daily worker that closes any `WAITING` group older than 14 days and refunds its participants to fresh placements. Lesson: state machines need an escape hatch.

## 9.4 Code Quality and Style

We use ESLint and Prettier across all three codebases with shared rules. TypeScript is set to `strict` mode. Pre-commit hooks (via Husky) format and lint changed files. Code review is done in GitHub pull requests, even for solo work, to keep a record of intent.

---

# Chapter 10 — Results and Discussion

## 10.1 The Pilot

A two-week pilot was run with a small group of student users — twenty-one in total, drawn from our own college and from a friend's coaching centre. The pilot was not a controlled study; the goal was to validate that the system works end-to-end under real use and to gather qualitative feedback.

Pilot users were asked to install the APK on their phones, sign up, complete onboarding, and then use the app at their own pace for two weeks. They were given no schedule or quotas. We observed usage through the admin analytics screens and held two short interviews per user — one at the start, one at the end.

## 10.2 Quantitative Findings

The numbers below are summary statistics from the pilot. They are not statistically powerful (the sample is small), but they are honest.

**Table 9.1 — Pilot study summary**

| Metric | Value |
|---|---|
| Total users | 21 |
| Users still active in week 2 | 16 (76 %) |
| Median exercises per active user per day | 3 |
| Median session length | 6 minutes |
| Total exercises completed | 612 |
| Average exercise score | 71 % |
| Users who reached a 7-day streak | 9 |
| Users who broke a streak at least once | 13 |
| Users who refilled a heart with Diamonds | 7 |
| Leaderboard groups formed | 4 |
| Leaderboard groups completed a full season | 2 |

The 76 % week-two retention is encouraging given that no notifications, marketing or external incentives were used. The relatively short session length (six minutes median) is in line with the design assumption that this app should fit into small windows of time, not replace dedicated study.

The XP curve over the pilot, shown in Figure 9.1, has the shape one might expect: most users grow XP steadily for the first few days, with a small plateau in the middle of week one as initial novelty fades, and a recovery in week two for those who built a streak.

## 10.3 Qualitative Findings

The interviews surfaced the following themes.

- **Streaks work.** Almost every active user mentioned the streak as a reason they opened the app on at least one day they would otherwise have skipped. The flip side is that the two users who broke long streaks expressed real disappointment, suggesting that a streak-freeze mechanism is overdue.
- **Hearts divide opinion.** Some users found the hearts mechanism a fair cost on careless answers. Others found it frustrating, especially on hard questions where they felt the wrong answer was honestly tried. A planned change — "no heart loss on questions tagged as hard, the first time only" — has been added to the backlog.
- **Leaderboards motivated mid-rankers most.** Users who found themselves around position 5–7 in their group were the most likely to log in to defend or improve their rank. Users at the very top or the very bottom were less moved by the leaderboard.
- **The exercise-complete celebration screen needs work.** Several users said the screen felt too short or too long depending on what was being awarded. Tuning the celebration screen is a separate piece of design work that we have not completed.
- **The onboarding choice between exam and subject was the right one.** Users reported that being able to choose either path felt natural and avoided the clumsy "tell us everything about yourself" form that some other apps use.

## 10.4 Performance

API latency held up well. On the pilot deployment, median response times for the most-called endpoints were:

| Endpoint | Median (ms) | p95 (ms) |
|---|---|---|
| `GET /catalog/subjects` | 18 | 43 |
| `GET /exercise/:id` | 27 | 58 |
| `POST /exercise/complete` | 86 | 211 |
| `GET /leaderboard` | 14 | 31 |
| `GET /me/stats` | 11 | 22 |

The `POST /exercise/complete` endpoint is the heaviest because of the transaction it carries. The latency is acceptable; the 95th percentile of around 200 ms means the user feels the celebration screen as instant.

## 10.5 What Surprised Us

A few things that we did not predict.

- The number of users who chose the *subject* path in onboarding (eleven of twenty-one) was higher than we expected. Going in we assumed the exam-targeted path would dominate. The implication is that the platform should not be marketed only as an exam tool; "improve in Physics" is itself a goal.
- The most popular subject in the pilot was not Physics or Mathematics, as we would have guessed, but Computer Science fundamentals and Python. We attribute this to the makeup of our pilot group, but it does suggest that programming-focused content has appetite.
- The admin analytics screen ended up being used more by *us* than by anyone else. Several content tweaks in the second week were driven by spotting outlier scores in the analytics — for instance, a question with a 3 % correct rate was traced to a typo in the answer key.

---

# Chapter 11 — Limitations

We list the limitations honestly. A capstone that pretends to be a finished commercial product helps no one.

- **Content volume is small.** The pilot covered roughly 50 units across seven subjects. A real launch would need ten times that and would need ongoing curation.
- **No spaced repetition.** As discussed, the current build delivers exercises in the order chosen by the author. A revision queue based on prior errors is the obvious next feature.
- **No push notifications.** Streak reminders and league updates would be far more effective with push than with email or in-app notifications alone.
- **No offline mode.** Users on flaky networks (a real scenario in many parts of India) will have a degraded experience. A read-side cache and an outbox for posting attempts would address this.
- **No iOS App Store presence.** The current iOS build is via TestFlight only. Submission to the App Store has its own process and was outside the project's time budget.
- **Single-region deployment.** All traffic in the pilot routed to one VM. Multi-region deployment, read replicas, and a CDN are operational improvements, not architectural ones, but they are real work.
- **No formal accessibility audit.** We have used standard React Native components which carry baseline accessibility, but we have not run a screen-reader audit or a colour-contrast audit.
- **No payment integration.** Diamond purchases are designed for but not wired up to a payment provider.
- **The administrator role model is binary.** A single `isAdmin` flag is not enough for a team where some members can edit content but not run database queries. A small role/permission system is needed.

---

# Chapter 12 — Conclusion and Future Work

## 12.1 Conclusion

Locus set out to do one thing: take the engagement design that has worked so well for language-learning apps and apply it, faithfully, to MCQ practice for competitive exam preparation. The result is a working three-codebase system — a NestJS backend, a Next.js admin console and a React Native mobile client — that supports both exam-targeted and subject-curious learners, awards XP and Diamonds in atomic database transactions, manages a hearts-based difficulty system with lazy regeneration, tracks daily streaks across time zones, and runs an asynchronous league-based leaderboard whose per-group ten-day season ensures every player a fair window in which to compete.

The hybrid relational–document approach to question storage allowed us to support five different question types — MCQ, MATCH, REORDER, COMPLETE and TRANSLATE — without a schema migration for each. Redis Sorted Sets gave us O(log N) leaderboard updates. The asynchronous lobby model removed the late-joiner unfairness that plagues global seasons. A small pilot with twenty-one student users showed 76 % week-two retention with no marketing or notifications, and surfaced concrete, actionable feedback that has shaped the future roadmap.

The project is far from complete. There is plenty of content to write, plenty of polish to add, and several features that would meaningfully improve the experience. But as a capstone — as evidence that we can take an idea from problem statement to a working, multi-component, gamified mobile system — we are satisfied with the result.

## 12.2 Future Work

Several items are queued for the next phase.

**Spaced-repetition revision queue.** Track every wrong answer, schedule it for review at increasing intervals, surface a daily revision deck on the home screen. Drawing from the SM-2 algorithm and adapting it for MCQ where the "ease" of an item is influenced by both response time and historical correctness.

**Streak freezes and weekend-amnesty.** Let a user spend a small Diamond cost in advance to protect a missed day. This addresses the most common piece of negative feedback we received in the pilot.

**Push notifications.** Streak reminders, league countdown alerts, "your group filled and the season just started!". Implementing these via Expo's notification service is straightforward; the harder work is choosing the right tone and frequency.

**Offline mode.** Cache the most recent few exercises locally; queue completion submissions in an outbox and flush them when connectivity returns. The data model already supports this; the work is on the client.

**Adaptive difficulty.** Use the rich `ExerciseAttempt` history to recommend the next exercise — not just the next in the author's order, but the next that lies in the learner's zone of proximal development. This crosses into recommender-system territory; we have prototyped a simple weighted scoring approach but have not deployed it.

**Better content authoring.** A bulk-import tool, a question-difficulty calibration screen (showing the correct-rate distribution for each question), and a versioning system for content edits.

**AI-generated explanations.** Many questions in the pilot lacked an explanation field. A generation step using a large language model, with a human review gate, could fill this gap quickly.

**Granular admin roles.** Replace the binary `isAdmin` flag with a small role/permission table. Editors, reviewers and operators have genuinely different rights.

**Multi-region deployment.** Move the database to a managed service, run two or three API instances behind a load balancer, deploy a CDN in front of the catalogue, and add read replicas for the heavier analytics queries.

**Web client.** A React-based web client sharing UI components with the mobile app would let users practice on a laptop. The backend already supports this; it is purely a frontend project.

## 12.3 Reflections

Working on this capstone taught us several things that no course on its own would have. The first is that a working system is the sum of many small decisions, almost none of them dramatic. Choosing to put the heart logic in a util file rather than inside the service, choosing to store dates in UTC and convert at the application layer, choosing to use Sorted Sets in Redis instead of computing rank in PostgreSQL — none of these were heroic moments. But each one removed a problem we would otherwise have had to solve later.

The second is that gamification is design, not just code. The numbers in the rewards constants file shape the user's experience as much as anything in the UI. Tuning them is a careful exercise, and there is no substitute for watching real users to see what feels good and what feels punishing.

The third, and the one we will carry forward, is that the boring parts of the system — the migrations, the validation, the transaction boundaries, the daily worker — are the parts that decide whether the impressive parts ever get to be seen. We are grateful for the chance the capstone gave us to do all of them, in a single project, end to end.

---

# References

1. Deci, E. L., and Ryan, R. M. *Intrinsic Motivation and Self-Determination in Human Behavior*. Plenum Press, New York, 1985.
2. Deterding, S., Dixon, D., Khaled, R., and Nacke, L. "From Game Design Elements to Gamefulness: Defining Gamification." *Proceedings of the 15th International Academic MindTrek Conference*, 2011, pp. 9–15.
3. Hamari, J., Koivisto, J., and Sarsa, H. "Does Gamification Work? — A Literature Review of Empirical Studies on Gamification." *47th Hawaii International Conference on System Sciences*, 2014, pp. 3025–3034.
4. Karpicke, J. D., and Roediger, H. L. "The Critical Importance of Retrieval for Learning." *Science*, 319 (5865), 2008, pp. 966–968.
5. Pimsleur, P. "A Memory Schedule." *The Modern Language Journal*, 51 (2), 1967, pp. 73–75.
6. Wozniak, P. A. *Optimization of Learning: SuperMemo Method*. Doctoral thesis, University of Economics, Wroclaw, 1990.
7. Werbach, K., and Hunter, D. *For the Win: How Game Thinking Can Revolutionize Your Business*. Wharton Digital Press, 2012.
8. Mozer, M. C., Pashler, H., et al. "Predicting the Optimal Spacing of Study: A Multiscale Context Model of Memory." *Advances in Neural Information Processing Systems*, 2009.
9. NestJS Documentation. https://docs.nestjs.com (accessed during project work).
10. Prisma Documentation. https://www.prisma.io/docs (accessed during project work).
11. PostgreSQL Documentation, Chapter on JSON Types. https://www.postgresql.org/docs (accessed during project work).
12. Redis Documentation, Sorted Sets. https://redis.io/docs/data-types/sorted-sets (accessed during project work).
13. React Native and Expo Documentation. https://reactnative.dev and https://docs.expo.dev (accessed during project work).
14. Next.js Documentation. https://nextjs.org/docs (accessed during project work).
15. Tailwind CSS Documentation. https://tailwindcss.com/docs (accessed during project work).
16. Owen, V. E., Roy, M. H., et al. "Player Identification in Educational Games." *Proceedings of the International Conference on the Foundations of Digital Games*, 2016.
17. Chou, Y. *Actionable Gamification: Beyond Points, Badges, and Leaderboards*. Octalysis Media, 2015.
18. Sailer, M., Hense, J. U., et al. "How Gamification Motivates: An Experimental Study of the Effects of Specific Game Design Elements on Psychological Need Satisfaction." *Computers in Human Behavior*, 69, 2017, pp. 371–380.
19. Hwang, G. J., and Wu, P. H. "Advancements and Trends in Digital Game-based Learning Research: A Review of Publications in Selected Journals from 2001 to 2010." *British Journal of Educational Technology*, 43 (1), 2012.
20. OWASP Foundation. *OWASP Top Ten 2021*. https://owasp.org/Top10 (accessed during project work).

---

# Appendix A — API Reference Summary

The following is an abridged summary of the principal API endpoints. Full request and response schemas live in the codebase as DTO classes.

**Auth**

- `POST /auth/signup` — create a new user; returns a JWT and a user summary.
- `POST /auth/signin` — sign in; returns a JWT and a user summary.

**Onboarding**

- `POST /onboarding/exam` — record an exam choice and exam date.
- `POST /onboarding/subject` — record a subject choice and a difficulty rating (1, 2 or 3).

**Catalogue (read-only for the mobile client)**

- `GET /catalog/subjects` — list subjects.
- `GET /catalog/subjects/:slug` — fetch one subject with its units.
- `GET /catalog/units/:id` — fetch one unit with its exercises.
- `GET /catalog/exercises/:id` — fetch one exercise with its questions.

**Gamification**

- `POST /exercise/complete` — submit an exercise result; returns the reward summary.
- `POST /gamification/hearts/refill` — spend Diamonds to refill one heart.
- `GET /me/stats` — fetch the current user's stats (XP, Diamonds, Hearts, streak, league).
- `GET /me/ledger` — fetch the Diamond ledger for the current user.

**Leaderboard**

- `GET /leaderboard` — fetch the user's current group, the participant list, and the time remaining in the season.

**Admin (require AdminGuard)**

- `POST /admin/subjects` — create a subject.
- `PATCH /admin/subjects/:id` — update a subject.
- `DELETE /admin/subjects/:id` — delete a subject and its dependents.
- `POST /admin/units`, `POST /admin/exercises`, `POST /admin/questions` — analogous create endpoints.
- `GET /admin/analytics/overview` — daily active users, exercises completed, average score, etc.
- `GET /admin/users` — list users with filters.
- `GET /admin/users/:id` — fetch a single user with stats and recent activity.

---

# Appendix B — Sample Question Payloads

Question content is stored as a JSON-encoded string in the `Question.content` column. Below are minimal valid payloads for each supported type.

**MCQ**

```json
{
  "options": ["9.8 m/s²", "9.0 m/s²", "10.5 m/s²", "8.2 m/s²"],
  "correct_index": 0
}
```

**MATCH**

```json
{
  "left":  ["F = ma", "E = mc²", "PV = nRT"],
  "right": ["Newton's second law", "Mass-energy equivalence", "Ideal gas law"],
  "map":   { "F = ma": "Newton's second law",
             "E = mc²": "Mass-energy equivalence",
             "PV = nRT": "Ideal gas law" }
}
```

**REORDER**

```json
{
  "items": ["Identify base case", "Define recursive step", "Combine results", "Return final value"],
  "order": [0, 1, 2, 3]
}
```

**COMPLETE (fill-in-the-blank)**

```json
{
  "template": "The value of acceleration due to gravity at Earth's surface is approximately ___ m/s².",
  "answers":  ["9.8", "9.81", "9.80"]
}
```

**TRANSLATE**

```json
{
  "source_language": "English",
  "target_language": "Hindi",
  "source_text": "Force equals mass times acceleration.",
  "answers": ["बल द्रव्यमान गुणा त्वरण के बराबर होता है।"]
}
```

---

*End of Report.*
