import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, Sparkles, CheckCircle } from "lucide-react";
import Narrator from "./Narrator";

interface StreakMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneValue: number;
}

export default function StreakMilestoneModal({ isOpen, onClose, milestoneValue }: StreakMilestoneModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  
  const lastDays = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (4 - i));
    return {
      dayName: weekdays[d.getDay()],
      isLogged: true
    };
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Translucent cinematic background */}
          <motion.div
            id="milestone-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          />

          {/* Celebration particles overlay */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  x: "50%", 
                  y: "50%", 
                  scale: 0.2,
                  rotate: 0 
                }}
                animate={{ 
                  opacity: [0, 1, 1, 0], 
                  x: `${Math.random() * 80 + 10}%`, 
                  y: `${Math.random() * 80 + 10}%`,
                  scale: Math.random() * 1.2 + 0.6,
                  rotate: Math.random() * 360
                }}
                transition={{ 
                  duration: 2.5, 
                  ease: "easeOut",
                  repeat: Infinity,
                  repeatDelay: Math.random() * 1.2
                }}
                className="absolute w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: i % 3 === 0 ? "#FF5CA8" : i % 3 === 1 ? "#8B5CF6" : "#22C55E"
                }}
              />
            ))}
          </div>

          {/* Core Milestone Modal Card */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              id="milestone-card"
              initial={{ scale: 0.85, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-sm bg-white dark:bg-[#202534] border border-[#ECECEC] dark:border-white/10 rounded-[24px] p-6 text-center relative shadow-[0_16px_24px_rgba(0,0,0,0.45)]"
            >
              <div className="absolute -top-5 left-6 text-[#FF5CA8] animate-pulse">
                <Sparkles size={28} />
              </div>
              <div className="absolute -top-4 right-8 text-[#8B5CF6] animate-bounce">
                <Award size={26} />
              </div>

              {/* Flame Logo with Bounce */}
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 mx-auto bg-[#FF5CA8]/10 rounded-full flex items-center justify-center border border-[#FF5CA8]/20 mb-4"
              >
                <span className="text-4xl select-none">🏆</span>
              </motion.div>

              {/* Milestone metrics header */}
              <h1 className="text-3xl font-black text-[#111111] dark:text-[#FFFFFF] tracking-tight mb-1">
                {milestoneValue} DAYS!
              </h1>
              <p className="text-[#FF5CA8] text-[10px] font-black tracking-widest uppercase mb-4">
                Streak Milestone Reached!
              </p>

              <p className="text-[#707070] dark:text-[#C6CBD8] text-xs leading-relaxed mb-5 max-w-xs mx-auto font-medium">
                You are cementing the cash logging habit! Your personal companion is cheering, and your budget is fully disciplined. Excellent discipline! 🎉              </p>

              {/* Day Progress Strip */}
              <div className="bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[18px] p-4 mb-5">
                <div className="text-[9px] font-black text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider mb-2 text-left">
                  Last 5 Days Logged
                </div>
                <div className="flex justify-between items-center gap-1">
                  {lastDays.map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                      <div className="text-[9px] font-bold text-[#707070] dark:text-[#C6CBD8]">{day.dayName}</div>
                      <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
                        <CheckCircle size={14} strokeWidth={3} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini vector happy cat face replaced with official Narrator */}
              <div className="mb-6 flex justify-center">
                <Narrator size="achievement" animation="bounce" />
              </div>

              {/* CTA Keep going button */}
              <button
                id="milestone-cta-btn"
                onClick={onClose}
                className="w-full bg-[#FF5CA8] hover:bg-[#ff3c96] text-white font-black py-3.5 rounded-[16px] text-xs transition-colors cursor-pointer shadow-md select-none active:scale-98 outline-none"
              >
                Keep Logging Discipline!
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
