import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, getDay, isSameDay } from 'date-fns';
import type { Transaction } from '@/types';

interface HeatmapCalendarProps {
  currentDate: Date;
  transactions: Transaction[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function HeatmapCalendar({ currentDate, transactions, selectedDate, onSelectDate }: HeatmapCalendarProps) {
  const { days, maxValue } = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start, end });
    
    const dayData = daysInMonth.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTxns = transactions.filter(t => t.timestamp.startsWith(dateStr));
      const total = dayTxns.reduce((sum, t) => sum + t.amount, 0);
      return { date, total, txns: dayTxns.length };
    });

    const max = Math.max(...dayData.map(d => d.total));
    
    // Add padding for start of month
    const startDay = getDay(start);
    const paddedDays = Array(startDay === 0 ? 6 : startDay - 1).fill(null); // Adjust if week starts on Monday

    return { days: dayData, maxValue: max > 0 ? max : 1, padding: paddedDays };
  }, [currentDate, transactions]);

  const startDay = getDay(startOfMonth(currentDate));
  // Convert Sunday (0) to 6, others to day - 1 so Monday is 0
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;
  const paddingArray = Array(adjustedStartDay).fill(null);

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day, i) => (
          <div key={`wd-${i}`} className="text-center text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {day}
          </div>
        ))}
        
        {paddingArray.map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}
        
        {days.map((day, i) => {
          const isSelected = selectedDate && isSameDay(day.date, selectedDate);
          
          // Calculate intensity: 0 to 4
          let intensity = 0;
          if (day.total > 0) {
            const ratio = day.total / maxValue;
            if (ratio > 0.75) intensity = 4;
            else if (ratio > 0.5) intensity = 3;
            else if (ratio > 0.25) intensity = 2;
            else intensity = 1;
          }

          const baseColors = [
            'bg-background border-border/50', // 0
            'bg-primary/20 border-primary/20', // 1
            'bg-primary/40 border-primary/40', // 2
            'bg-primary/70 border-primary/70', // 3
            'bg-primary border-primary', // 4
          ];

          return (
            <motion.button
              key={day.date.toISOString()}
              onClick={() => onSelectDate(day.date)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              className={`aspect-square rounded-md border flex items-center justify-center transition-colors relative ${baseColors[intensity]}`}
            >
              {isSelected && (
                <div className="absolute inset-0 rounded-md ring-2 ring-foreground ring-offset-2 ring-offset-card z-10" />
              )}
              {day.date.getDate()}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
