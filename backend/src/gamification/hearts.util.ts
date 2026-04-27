import { HEARTS } from './rewards.constants';

export interface HeartState {
  /** Number of hearts available right now. */
  hearts: number;
  /** New `lastHeartRefillAt` to persist. null when at MAX. */
  lastHeartRefillAt: Date | null;
  /** Server time when the next +1 regen will land. null when at MAX. */
  nextHeartAt: Date | null;
}

/**
 * Apply time-based regeneration to a stored hearts value.
 *
 * Rules:
 * - +1 heart per `REGEN_INTERVAL_MS` since `lastHeartRefillAt`.
 * - Capped at `HEARTS.MAX`.
 * - When the result reaches MAX, `lastHeartRefillAt` is cleared and the
 *   timer stops (so the user keeps full hearts indefinitely).
 * - When the result is below MAX, `lastHeartRefillAt` is rolled forward
 *   by exactly `gained * REGEN_INTERVAL_MS` so the partial progress
 *   toward the next heart is preserved.
 */
export function applyHeartRegen(
  storedHearts: number,
  lastHeartRefillAt: Date | null,
  now: Date = new Date(),
): HeartState {
  const max = HEARTS.MAX;
  const interval = HEARTS.REGEN_INTERVAL_MS;

  if (storedHearts >= max) {
    return { hearts: max, lastHeartRefillAt: null, nextHeartAt: null };
  }
  if (!lastHeartRefillAt) {
    // Below MAX but no anchor — start the timer now.
    return { hearts: storedHearts, lastHeartRefillAt: now, nextHeartAt: new Date(now.getTime() + interval) };
  }

  const elapsed = now.getTime() - lastHeartRefillAt.getTime();
  const gained = Math.max(0, Math.floor(elapsed / interval));
  const newHearts = Math.min(max, storedHearts + gained);

  if (newHearts >= max) {
    return { hearts: max, lastHeartRefillAt: null, nextHeartAt: null };
  }
  // Roll the anchor forward by the consumed regen ticks.
  const newAnchor = new Date(lastHeartRefillAt.getTime() + gained * interval);
  const nextHeartAt = new Date(newAnchor.getTime() + interval);
  return { hearts: newHearts, lastHeartRefillAt: newAnchor, nextHeartAt };
}

/**
 * Compute the new heart state after losing N hearts. Starts the regen
 * timer when transitioning from MAX -> below-MAX.
 */
export function loseHearts(state: HeartState, lost: number, now: Date = new Date()): HeartState {
  const max = HEARTS.MAX;
  const newHearts = Math.max(0, state.hearts - lost);
  if (newHearts >= max) {
    return { hearts: max, lastHeartRefillAt: null, nextHeartAt: null };
  }
  // If we just dropped from MAX, start the regen anchor at `now`.
  const anchor = state.lastHeartRefillAt ?? now;
  return {
    hearts: newHearts,
    lastHeartRefillAt: anchor,
    nextHeartAt: new Date(anchor.getTime() + HEARTS.REGEN_INTERVAL_MS),
  };
}
