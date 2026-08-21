import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { BUCKET_LABELS } from '@/utils';
import type { BudgetAllocation } from '@/types';

interface OverBudgetIndicatorsProps {
  allocations: BudgetAllocation[];
  income: number;
}

export function OverBudgetIndicators({ allocations, income }: OverBudgetIndicatorsProps) {
  const overBudgetItems = allocations.filter((a) => {
    const targetAmount = (a.allocationPercent / 100) * income;
    return a.spent > targetAmount;
  });

  if (overBudgetItems.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3"
      >
        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
        <span className="text-sm font-semibold tracking-wide text-foreground">
          All categories are within budget limits. Great job!
        </span>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {overBudgetItems.map((a, i) => {
        const targetAmount = (a.allocationPercent / 100) * income;
        const excess = a.spent - targetAmount;
        
        return (
          <motion.div 
            key={a.bucket}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 flex items-start sm:items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wide text-foreground">
                {BUCKET_LABELS[a.bucket]} Over Budget
              </span>
              <span className="text-xs font-medium text-muted-foreground mt-0.5">
                Exceeded target by <strong className="text-destructive">₹{excess.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
