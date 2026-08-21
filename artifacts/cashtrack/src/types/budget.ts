import type { Bucket } from './category';

/**
 * A monthly budget allocation, shaped like a future `GET /budgets/:month`
 * REST response. `allocationPercent` records the target split (the 70/20/10
 * rule by default) while `spent` is derived from transactions at read time.
 */
export interface BudgetAllocation {
  bucket: Bucket;
  allocationPercent: number;
  spent: number;
}

export interface Budget {
  id: string;
  /** "YYYY-MM" */
  month: string;
  income: number;
  allocations: BudgetAllocation[];
}
