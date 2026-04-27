# Gamification and Leaderboard Implementation Specification

This document outlines the logic for XP, Diamonds, Day Streaks, and the League-based Leaderboard system.

## 1. XP and Currency (Diamonds) Logic

Rewards should be processed immediately upon the `EXERCISE_COMPLETED` event within a database transaction.

| Action | Reward | Condition |
| :--- | :--- | :--- |
| **Complete Exercise** | +20 XP | Exercise status = 'completed' |
| **Perfect Lesson** | +5 XP (Bonus) | Score = 100% |
| **Unit Completion** | +100 Diamonds | All exercises in a unit = 'completed' |
| **7-Day Streak** | +150 Diamonds | `current_streak % 7 == 0` |


### XP Calculation
Points are awarded upon the completion of any exercise:
- **Base XP:** +20 XP per completed exercise.
- **Perfect Score Bonus:** +5 XP if the user gets 100% of the questions correct.

### Diamond Rewards
- **7-Day Streak Bonus:** +150 Diamonds every time a user hits a multiple of 7 in their streak (7, 14, 21...).
- **Unit Completion:** +100 Diamonds upon finishing all topics/exercises within a specific Unit.
 
---

## 2. Day Streak Logic

The streak tracks consecutive days of activity. It should be validated whenever an exercise is completed.

- **Check Logic:**
    - If `last_activity_date == today`: Do nothing (streak already recorded).
    - If `last_activity_date == yesterday`: `streak_count += 1`.
    - If `last_activity_date < yesterday`: `streak_count = 1` (reset).
- **Grace Period:** A "day" is defined by the user's local timezone.
- **Background Task:** A daily worker (cron) should run at midnight to check for users who did not participate "yesterday" and set their `streak_count` to 0.



### 2.1 The Update Algorithm
Run this logic whenever a user completes their **first** exercise of the day.

1.  **Get `last_activity_date`** from the user's profile.
2.  **Compare with `current_date`**:
    * **Case A (Same Day):** If `last_activity_date == today`, do nothing (streak already counted).
    * **Case B (Consecutive Day):** If `last_activity_date == yesterday`, increment `current_streak` by 1.
    * **Case C (Broken Streak):** If `last_activity_date < yesterday`, reset `current_streak` to 1.
3.  **Update `last_activity_date`** to `today`.

### 2.2 Background Maintenance (The "Resetter")
* **Cron Job:** Run a daily task at 00:01 AM.
* **Logic:** Find users where `last_activity_date < yesterday` and `current_streak > 0`. Set their `current_streak` to 0.


---
## 3. Asynchronous League & Leaderboard System

### Core Structure
- **Total Leagues:** 30 tiers (e.g., Level 1 Bronze to Level 30 Obsidian). Acts as a permanent prestige badge.
- **Group Size:** Exactly 12 Users per leaderboard group.
- **Season Duration:** 10 Days (Starts dynamically per group).

### Asynchronous Grouping Mechanism
The League system does not operate on global dates. It operates on a rolling "Lobby" basis.

1. **The Trigger:** A user completes an exercise.
2. **The Placement:** - The backend checks for an "Open" group in the user's current League tier.
    - If an Open group exists (e.g., 5/12 users), the user is added to it.
3. **The Lobby State (Waiting):** - Until the group hits 12 members, the group is in a `WAITING` state. 
    - **Crucial Rule:** Any XP earned by users while the group is in the `WAITING` state **does not** count toward the leaderboard competition. The UI should display: *"Waiting for opponents... (X/12)"*
4. **The Activation:** - When the 12th user joins, the group state changes to `ACTIVE`.
    - The 10-Day countdown timer begins for that specific group.
    - All XP earned from this exact moment forward counts toward the leaderboard.
5. **The Overflow:**
    - The 13th user to complete an exercise will trigger the creation of a brand new "Open" group in that tier (1/12 users).

### Promotion & Demotion Rules
When a group's specific 10-day timer expires, the 12 users are ranked by XP earned during the active period:
1. **Promotion Zone (Top 5):** Move up to the next League tier (+1).
2. **Safe Zone (Middle 4):** Remain in the current League tier.
3. **Demotion Zone (Bottom 3):** Move down to the previous League tier (-1). *Users at Level 1 cannot be demoted.*

**Tie-Breaker Rule:** If users have the exact same XP (e.g., multiple users tied at 0 XP), the user who achieved that XP total *first* (timestamp) ranks higher.

---


## 4. Technical Implementation Notes

### Database Tables
- `user_stats`: Stores `total_xp`, `diamonds`, `current_league_index`, `current_streak`, and `last_activity_date`.
- `leaderboard_groups`: Stores `group_id`, `season_id`, and `league_tier`.
- `leaderboard_participants`: Links `user_id` to `group_id` and tracks `season_xp`.

### API Requirements
- `POST /exercise/complete`: Triggers XP/Diamond calculation, updates `last_activity_date`, and increments `season_xp` if the user is in an active group.
- `GET /leaderboard`: Returns the user's current group ranking and the countdown for the 10-day season.

### Scalability Recommendation
For the Leaderboard Ranking, use **Redis Sorted Sets** (`ZSET`).
- Key format: `leaderboard:{group_id}`
- Value: `user_id`
- Score: `season_xp`
This allows for $O(\log N)$ updates and instant rank retrieval.
