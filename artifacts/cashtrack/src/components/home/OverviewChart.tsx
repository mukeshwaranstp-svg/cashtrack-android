import { motion } from 'framer-motion';
import { BUCKET_COLORS, BUCKET_LABELS } from '@/utils';
import type { BudgetAllocation } from '@/types';

interface OverviewChartProps {
  allocations: BudgetAllocation[];
}

export function OverviewChart({ allocations }: OverviewChartProps) {
  const totalSpent = allocations.reduce((sum, a) => sum + a.spent, 0);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  const segments = allocations.map((a) => {
    const percent = totalSpent > 0 ? a.spent / totalSpent : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += percent * circumference;
    return {
      bucket: a.bucket,
      percent,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--background))" strokeWidth="12" />
          {segments.map((seg, i) => (
            <motion.circle
              key={seg.bucket}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={BUCKET_COLORS[seg.bucket]}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: seg.strokeDasharray }}
              transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
            />
          ))}
        </svg>
      </div>

      <div className="flex flex-col gap-3 flex-1 pl-6 sm:pl-8">
        {allocations.map((a) => {
          const percent = totalSpent > 0 ? a.spent / totalSpent : 0;
          return (
            <div key={a.bucket} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: BUCKET_COLORS[a.bucket] }}
                />
                <span className="text-foreground font-semibold tracking-wide">{BUCKET_LABELS[a.bucket]}</span>
              </div>
              <span className="text-muted-foreground font-bold tabular-nums">
                {Math.round(percent * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
