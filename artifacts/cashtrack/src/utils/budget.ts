import type { Bucket, Transaction } from '@/types';

/** Target allocation percentages for the 70/20/10 budgeting rule. */
export const BUCKET_TARGETS: Record<Bucket, number> = {
  needs: 70,
  wants: 20,
  savings: 10,
};

export const BUCKET_LABELS: Record<Bucket, string> = {
  needs: 'Needs',
  wants: 'Wants',
  savings: 'Savings',
};

/** Sums transaction amounts grouped by bucket. */
export function sumByBucket(transactions: Transaction[]): Record<Bucket, number> {
  const totals: Record<Bucket, number> = { needs: 0, wants: 0, savings: 0 };
  for (const txn of transactions) {
    totals[txn.bucket] += txn.amount;
  }
  return totals;
}

/** Returns what percent of income a bucket's spend represents. */
export function bucketPercentOfIncome(spent: number, income: number): number {
  if (income <= 0) return 0;
  return spent / income;
}
