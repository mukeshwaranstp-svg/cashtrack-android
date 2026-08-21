import { motion } from 'framer-motion';
import { formatCurrency, BUCKET_LABELS } from '@/utils';
import type { Transaction } from '@/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const displayTxns = transactions
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-bold tracking-tight text-foreground px-1">Recent Transactions</h3>
      
      <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="max-h-[360px] overflow-y-auto overscroll-contain">
          {displayTxns.map((txn, i) => {
            const date = new Date(txn.timestamp);
            const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const emoji = txn.emoji || '💸';

            return (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center justify-between p-4 ${
                  i !== displayTxns.length - 1 ? 'border-b border-border/40' : ''
                } hover:bg-background/50 transition-colors`}
              >
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background text-lg shadow-sm border border-border">
                    {emoji}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-foreground text-sm sm:text-base">{txn.note || txn.category}</span>
                    <span className="text-[11px] sm:text-xs text-muted-foreground font-semibold tracking-wide">
                      {txn.category} • {BUCKET_LABELS[txn.bucket]}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className="font-bold tabular-nums text-foreground text-[15px] sm:text-base">
                    {formatCurrency(txn.amount)}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground font-bold tracking-wider mt-0.5">
                    {timeStr}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
