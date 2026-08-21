import type { Streak } from '@/types';

/**
 * Mock response for a future `GET /streak` endpoint -- tracks consecutive
 * days the user has logged at least one transaction.
 */
export const streak: Streak = {
  currentStreak: 9,
  longestStreak: 21,
  days: [
    { date: '2026-07-06', logged: true },
    { date: '2026-07-07', logged: true },
    { date: '2026-07-08', logged: true },
    { date: '2026-07-09', logged: true },
    { date: '2026-07-10', logged: true },
    { date: '2026-07-11', logged: true },
    { date: '2026-07-12', logged: true },
    { date: '2026-07-13', logged: true },
    { date: '2026-07-14', logged: true },
  ],
};
