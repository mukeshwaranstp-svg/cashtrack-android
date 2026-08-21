import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/utils';
import type { Bucket, BudgetAllocation, Transaction, Category } from '@/types';

interface BudgetTabsProps {
  allocations: BudgetAllocation[];
  transactions: Transaction[];
  categories: Category[];
  income: number;
}

const TABS: { id: Bucket; label: string }[] = [
  { id: 'needs', label: 'Need' },
  { id: 'wants', label: 'Want' },
  { id: 'savings', label: 'Sav' },
];

export function BudgetTabs({ allocations, transactions, income }: BudgetTabsProps) {
  const [activeTab, setActiveTab] = useState<Bucket>('needs');

  const activeAlloc = allocations.find((a) => a.bucket === activeTab) || allocations[0];
  const targetAmount = (activeAlloc.allocationPercent / 100) * income;
  const spent = activeAlloc.spent;
  const progressPercent = targetAmount > 0 ? Math.min((spent / targetAmount) * 100, 100) : 0;
  const isExceeded = spent > targetAmount;
  
  const topTxns = transactions
    .filter(t => t.bucket === activeTab)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col col-span-1">
      <div className="flex border-b border-border relative bg-background/30">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-bold tracking-wide transition-colors relative ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4 h-full"
          >
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {formatCurrency(spent)}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 font-medium">
                  of {formatCurrency(targetAmount)} ({activeAlloc.allocationPercent}%)
                </span>
              </div>
              <span className={`text-xs font-bold tracking-wide bg-background px-2.5 py-1 rounded-md border border-border ${isExceeded ? 'text-destructive' : 'text-primary'}`}>
                {Math.round(targetAmount > 0 ? (spent / targetAmount) * 100 : 0)}%
              </span>
            </div>

            <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full rounded-full ${isExceeded ? 'bg-destructive' : 'bg-primary'}`}
              />
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-3">
              {topTxns.map((txn) => (
                <div key={txn.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-sm border border-border shadow-sm">
                      {txn.emoji || '💸'}
                    </div>
                    <span className="text-foreground font-semibold truncate max-w-[140px] sm:max-w-[200px]">{txn.category}</span>
                  </div>
                  <span className="text-foreground tabular-nums font-bold shrink-0">{formatCurrency(txn.amount)}</span>
                </div>
              ))}
              {topTxns.length === 0 && (
                <div className="text-sm text-muted-foreground italic py-2 text-center">No transactions yet.</div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
