/**
 * Streak math per Helper/gamification_spec.md §2.
 * A "day" is the user's local calendar day. We compare YYYY-MM-DD strings.
 */
export function dateKeyInTz(date: Date, timezone: string): string {
  // en-CA gives ISO-like YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export type StreakOutcome = 'SAME_DAY' | 'CONTINUED' | 'RESET' | 'NEW';

export function computeStreak(
  lastActivity: Date | null,
  now: Date,
  timezone: string,
  currentStreak: number,
): { newStreak: number; outcome: StreakOutcome } {
  const todayKey = dateKeyInTz(now, timezone);
  const yesterdayKey = dateKeyInTz(new Date(now.getTime() - 86_400_000), timezone);

  if (!lastActivity) return { newStreak: 1, outcome: 'NEW' };

  const lastKey = dateKeyInTz(lastActivity, timezone);
  if (lastKey === todayKey) return { newStreak: currentStreak, outcome: 'SAME_DAY' };
  if (lastKey === yesterdayKey)
    return { newStreak: currentStreak + 1, outcome: 'CONTINUED' };
  return { newStreak: 1, outcome: 'RESET' };
}
