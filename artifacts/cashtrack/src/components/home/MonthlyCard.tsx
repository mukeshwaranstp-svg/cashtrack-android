import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils';

interface MonthlyCardProps {
  spent: number;
  trend: number;
}

export function MonthlyCard({ spent, trend }: MonthlyCardProps) {
  const isUp = trend > 0;
  const trendColor = isUp ? 'text-destructive' : 'text-primary';
  const trendIcon = isUp ? '↑' : '↓';
  const trendText = `${Math.abs(trend * 100).toFixed(0)}%`;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm col-span-1"
    >
      <span className="figure-md sm:figure-lg text-foreground mb-1 tracking-tighter">
        {formatCurrency(spent)}
      </span>
      <span className="text-xs sm:text-sm text-muted-foreground font-bold uppercase tracking-widest mb-4">
        Monthly Spending
      </span>
      
      <div className={`flex items-center gap-1.5 font-bold text-xs sm:text-sm ${trendColor} bg-background px-3 py-1.5 rounded-full border border-border shadow-sm`}>
        <span className="text-[10px]">{trendIcon}</span>
        <span>{trendText}</span>
      </div>
    </motion.div>
  );
}
