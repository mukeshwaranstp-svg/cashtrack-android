/**
 * Raw hex color tokens for the CashTrack theme, mirroring the CSS variables
 * defined in `index.css`. Use these when a library needs a literal hex/rgb
 * value (e.g. chart fills) instead of a Tailwind class.
 */
export const COLORS = {
  background: '#121212',
  card: '#1C1C1E',
  gold: '#D4AF37',
  crimson: '#E63946',
  textPrimary: '#FFFFFF',
  textSecondary: '#9A9A9E',
} as const;

/** Bucket -> chart color mapping, kept in sync with `--chart-*` CSS variables. */
export const BUCKET_COLORS = {
  needs: COLORS.gold,
  wants: COLORS.crimson,
  savings: COLORS.textSecondary,
} as const;
