/**
 * Daily logging streak, shaped like a future `GET /streak` REST response.
 * Tracks consecutive days the user has logged at least one transaction.
 */
export interface StreakDay {
  /** "YYYY-MM-DD" */
  date: string;
  logged: boolean;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  days: StreakDay[];
}
