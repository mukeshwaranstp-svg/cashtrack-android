import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { startOfMonth, endOfMonth, eachWeekOfInterval, format, isSameMonth } from 'date-fns';
import { formatCurrency } from '@/utils';
import type { Transaction } from '@/types';

interface WeeklyTrendChartProps {
  currentDate: Date;
  transactions: Transaction[];
}

export function WeeklyTrendChart({ currentDate, transactions }: WeeklyTrendChartProps) {
  const data = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    
    return weeks.map((weekStart, i) => {
      // Find end of week but cap at end of month
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const actualEnd = weekEnd > end ? end : weekEnd;
      
      const weekTxns = transactions.filter(t => {
        const d = new Date(t.timestamp);
        return d >= weekStart && d <= new Date(actualEnd.setHours(23, 59, 59, 999));
      });

      return {
        label: `W${i + 1}`,
        total: weekTxns.reduce((sum, t) => sum + t.amount, 0)
      };
    });
  }, [currentDate, transactions]);

  const maxVal = Math.max(...data.map(d => d.total), 1);
  
  // SVG drawing logic
  const height = 120;
  const width = 300;
  const paddingX = 20;
  const paddingY = 20;
  
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * innerWidth;
    const y = height - paddingY - (d.total / maxVal) * innerHeight;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  
  const areaPathD = `${pathD} L ${points[points.length - 1].split(',')[0]},${height - paddingY} L ${paddingX},${height - paddingY} Z`;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight text-foreground">Weekly Trend</span>
        <span className="text-xs text-muted-foreground font-medium">Spending over the month</span>
      </div>

      <div className="relative w-full h-[140px] flex items-center justify-center overflow-visible mt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={paddingX} y1={height/2} x2={width - paddingX} y2={height/2} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="hsl(var(--border))" strokeWidth="1" />
          
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          <motion.path
            d={areaPathD}
            fill="url(#trendGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          />

          <motion.path
            d={pathD}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {data.map((d, i) => {
            const [x, y] = points[i].split(',');
            return (
              <g key={i}>
                <motion.circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="hsl(var(--card))"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1, type: "spring" }}
                />
                <text
                  x={x}
                  y={height}
                  textAnchor="middle"
                  className="text-[10px] fill-muted-foreground font-bold"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
