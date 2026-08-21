import { motion } from 'framer-motion';
import { Mascot } from './Mascot';

interface HeaderProps {
  streakCount: number;
}

export function Header({ streakCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 pt-6 pb-4 bg-background/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Mascot variant="success" size={42} />
        <div className="flex flex-col">
          <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Dashboard</span>
          <span className="text-foreground text-lg font-bold tracking-tight">Good Morning</span>
        </div>
      </div>

      <motion.div 
        className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5 shadow-sm"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-sm leading-none">🔥</span>
        <span className="text-primary font-bold text-sm leading-none tabular-nums tracking-tight">{streakCount}</span>
      </motion.div>
    </header>
  );
}
