import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface MonthNavigationProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  disableNext: boolean;
}

export function MonthNavigation({ currentDate, onPrevMonth, onNextMonth, disableNext }: MonthNavigationProps) {
  return (
    <div className="flex items-center justify-between pb-2">
      <motion.button
        onClick={onPrevMonth}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-10 h-10 flex items-center justify-center rounded-full border border-border bg-card shadow-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>
      
      <div className="flex flex-col items-center">
        <motion.span 
          key={currentDate.toISOString()}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-bold tracking-tight text-foreground"
        >
          {format(currentDate, 'MMMM yyyy')}
        </motion.span>
      </div>

      <motion.button
        onClick={onNextMonth}
        disabled={disableNext}
        whileHover={!disableNext ? { scale: 1.05 } : {}}
        whileTap={!disableNext ? { scale: 0.95 } : {}}
        className={`w-10 h-10 flex items-center justify-center rounded-full border border-border shadow-sm transition-colors ${
          disableNext 
            ? 'bg-card/50 text-muted-foreground/30 cursor-not-allowed' 
            : 'bg-card text-muted-foreground hover:text-foreground'
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
