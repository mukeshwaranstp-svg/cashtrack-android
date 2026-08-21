import type { Bucket } from './category';

/**
 * A single expense/income entry. Shaped like a future `GET /transactions`
 * REST response item -- when a FastAPI backend replaces the mock data
 * layer, this interface should match the response schema unchanged.
 */
export interface Transaction {
  id: string;
  amount: number;
  category: string;
  bucket: Bucket;
  note: string;
  /** ISO 8601 timestamp string, e.g. "2026-07-14T18:32:00.000Z". */
  timestamp: string;
  /** Custom emoji derived for visual flair */
  emoji?: string;
}
