import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MascotProps {
  variant: 'warning' | 'success';
  size?: number;
}

export function Mascot({ variant, size = 48 }: MascotProps) {
  const [showSpeech, setShowSpeech] = useState(false);

  useEffect(() => {
    if (showSpeech) {
      const timer = setTimeout(() => setShowSpeech(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showSpeech]);

  const speechText = variant === 'warning' ? 'Log it now!' : 'Keep it up!';

  return (
    <div className="relative inline-flex items-center justify-center">
      <AnimatePresence>
        {showSpeech && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap z-20 pointer-events-none"
          >
            {speechText}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="cursor-pointer origin-center"
        onClick={() => setShowSpeech(true)}
        whileTap={{ scale: 0.85, y: -10 }}
        animate={{ y: [0, -4, 0], rotate: [0, 2, -2, 0] }}
        transition={{ 
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }}
        style={{ width: size, height: size }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Breathing effect scale on body */}
          <motion.g
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "50% 50%" }}
          >
            {/* Soft glow */}
            <circle cx="50" cy="50" r="45" fill={variant === 'warning' ? "#E63946" : "#D4AF37"} fillOpacity="0.15" />
            {/* Main body */}
            <circle cx="50" cy="50" r="36" fill={variant === 'warning' ? "#E63946" : "#D4AF37"} />
            
            {/* Eyes & Mouth */}
            {variant === 'success' ? (
              <>
                {/* Happy eyes */}
                <path d="M 36 44 Q 41 38 46 44" stroke="#121212" strokeWidth="4" strokeLinecap="round" />
                <path d="M 54 44 Q 59 38 64 44" stroke="#121212" strokeWidth="4" strokeLinecap="round" />
                {/* Smile */}
                <path d="M 42 56 Q 50 64 58 56" stroke="#121212" strokeWidth="4" strokeLinecap="round" />
              </>
            ) : (
              <>
                {/* Angry eyes */}
                <path d="M 34 40 L 44 46" stroke="#121212" strokeWidth="4" strokeLinecap="round" />
                <path d="M 66 40 L 56 46" stroke="#121212" strokeWidth="4" strokeLinecap="round" />
                <circle cx="40" cy="50" r="4.5" fill="#121212" />
                <circle cx="60" cy="50" r="4.5" fill="#121212" />
                {/* Angry mouth */}
                <path d="M 46 62 Q 50 58 54 62" stroke="#121212" strokeWidth="4" strokeLinecap="round" />
                {/* Puffed cheeks */}
                <circle cx="28" cy="56" r="6" fill="#121212" fillOpacity="0.2" />
                <circle cx="72" cy="56" r="6" fill="#121212" fillOpacity="0.2" />
              </>
            )}
          </motion.g>
        </svg>
      </motion.div>
    </div>
  );
}
