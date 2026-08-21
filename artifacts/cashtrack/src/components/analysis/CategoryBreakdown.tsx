import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils';
import type { Category, Transaction } from '@/types';

interface CategoryBreakdownProps {
  transactions: Transaction[];
  categories: Category[];
}

export function CategoryBreakdown({ transactions, categories }: CategoryBreakdownProps) {
  const data = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    let total = 0;
    
    transactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      total += t.amount;
    });

    return Object.entries(categoryTotals)
      .map(([name, amount]) => {
        const category = categories.find(c => c.name === name);
        return {
          name,
          amount,
          percent: total > 0 ? amount / total : 0,
          color: category?.color || '#9A9A9E'
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm flex flex-col gap-5">
      <span className="text-lg font-bold tracking-tight text-foreground">Top Categories</span>
      
      <div className="flex flex-col gap-4">
        {data.map((item, i) => (
          <motion.div 
            key={item.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-2.5 h-2.5 rounded-full shadow-sm" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-foreground tracking-wide">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-bold tracking-wider">{Math.round(item.percent * 100)}%</span>
                <span className="font-bold tabular-nums">{formatCurrency(item.amount)}</span>
              </div>
            </div>
            
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percent * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: item.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
