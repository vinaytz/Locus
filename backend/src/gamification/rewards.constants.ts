/**
 * Centralised reward constants — kept in code (not DB) so they can be tuned
 * without a migration. Source: Helper/gamification_spec.md §1.
 */
export const REWARDS = {
  EXERCISE_BASE_XP: 20,
  PERFECT_SCORE_BONUS_XP: 5,
  UNIT_COMPLETION_DIAMONDS: 100,
  STREAK_7_DIAMONDS: 150,
} as const;

/** Heart system — gameplay lives. */
export const HEARTS = {
  MAX: 5,
  REFILL_COST_DIAMONDS: 10, // cost in diamonds to refill ONE heart
  REGEN_INTERVAL_MS: 30 * 60 * 1000, // +1 heart every 30 minutes
} as const;

export const LEAGUE = {
  GROUP_SIZE: 12,
  SEASON_DAYS: 10,
  MIN_TIER: 1,
  MAX_TIER: 30,
  PROMOTION_TOP: 5,
  DEMOTION_BOTTOM: 3,
} as const;
