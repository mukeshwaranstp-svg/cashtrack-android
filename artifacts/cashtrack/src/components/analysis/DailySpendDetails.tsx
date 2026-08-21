import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { formatCurrency, BUCKET_LABELS } from '@/utils';
import type { Transaction } from '@/types';

interface DailySpendDetailsProps {
  date: Date | null;
  transactions: Transaction[];
}

export function DailySpendDetails({ date, transactions }: DailySpendDetailsProps) {
  if (!date) return null;

  const dateStr = format(date, 'yyyy-MM-dd');
  const dayTxns = transactions.filter(t => t.timestamp.startsWith(dateStr));
  const total = dayTxns.reduce((sum, t) => sum + t.amount, 0);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={date.toISOString()}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm flex flex-col gap-4"
      >
        <div className="flex items-end justify-between border-b border-border/50 pb-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              {format(date, 'EEEE, MMM d')}
            </span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          {dayTxns.length === 0 ? (
            <div className="text-sm text-muted-foreground italic py-4 text-center">
              No expenses logged on this day.
            </div>
          ) : (
            dayTxns.map((txn, i) => {
              const timeStr = new Date(txn.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              return (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border border-border shadow-sm text-lg">
                      {txn.emoji || '💸'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground text-sm">{txn.note || txn.category}</span>
                      <span className="text-[10px] text-muted-foreground font-bold tracking-wide uppercase">
                        {txn.category} • {BUCKET_LABELS[txn.bucket]}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold tabular-nums text-foreground text-sm">
                      {formatCurrency(txn.amount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold tracking-wider mt-0.5">
                      {timeStr}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
