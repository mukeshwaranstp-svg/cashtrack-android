/**
 * A spending bucket in the 70/20/10 rule.
 * needs    -- essential spending (rent, groceries, bills)          -- target 70%
 * wants    -- discretionary/lifestyle spending                     -- target 20%
 * savings  -- savings, investing, and debt payoff                  -- target 10%
 */
export type Bucket = 'needs' | 'wants' | 'savings';

/**
 * Shaped like a future `GET /categories` REST response item.
 */
export interface Category {
  id: string;
  name: string;
  bucket: Bucket;
  /** react-icons icon name (e.g. "FaHome"), resolved by the UI layer. */
  icon: string;
  /** Hex color used for charts/badges tied to this category. */
  color: string;
}
