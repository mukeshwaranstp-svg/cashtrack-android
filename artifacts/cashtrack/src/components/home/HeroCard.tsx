import { motion } from 'framer-motion';
import { Mascot } from './Mascot';

interface HeroCardProps {
  hasLoggedToday: boolean;
}

export function HeroCard({ hasLoggedToday }: HeroCardProps) {
  const isWarning = !hasLoggedToday;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
        isWarning 
          ? 'border-destructive/30 bg-[#1A1214]' 
          : 'border-primary/30 bg-[#1A1812]'
      }`}
    >
      <div className="flex items-center justify-between gap-4 relative z-10">
        <div className="flex flex-col gap-1.5 flex-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {isWarning ? 'Did you forget something?' : 'Discipline maintained'}
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            {isWarning 
              ? "You haven't logged today's expense yet." 
              : "Today's expense has been logged."}
          </p>
        </div>
        <div className="shrink-0 -mr-2">
          <Mascot variant={isWarning ? 'warning' : 'success'} size={68} />
        </div>
      </div>
      
      {/* Subtle background glow to make it feel premium */}
      <div 
        className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-[0.15] pointer-events-none ${
          isWarning ? 'bg-destructive' : 'bg-primary'
        }`}
      />
    </motion.div>
  );
}
