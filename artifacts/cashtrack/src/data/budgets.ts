import type { Budget } from '@/types';

/**
 * Mock response for a future `GET /budgets/:month` endpoint.
 * `spent` totals are pre-aggregated here to mirror what a backend would
 * compute server-side; the frontend should not need to re-derive them,
 * though `utils/budget.ts` provides a helper that recomputes from
 * transactions for consistency checks.
 */
export const budgets: Budget[] = [
  {
    id: 'budget_2026-07',
    month: '2026-07',
    income: 5200,
    allocations: [
      { bucket: 'needs', allocationPercent: 70, spent: 2364.69 },
      { bucket: 'wants', allocationPercent: 20, spent: 562.98 },
      { bucket: 'savings', allocationPercent: 10, spent: 810.0 },
    ],
  },
  {
    id: 'budget_2026-06',
    month: '2026-06',
    income: 5200,
    allocations: [
      { bucket: 'needs', allocationPercent: 70, spent: 3402.1 },
      { bucket: 'wants', allocationPercent: 20, spent: 1180.4 },
      { bucket: 'savings', allocationPercent: 10, spent: 520.0 },
    ],
  },
];
