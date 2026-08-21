import React from "react";
import { motion } from "motion/react";
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  PieChart, 
  Target 
} from "lucide-react";
import PageLayout from "./PageLayout";

interface CompanionOnboardingProps {
  onComplete: () => void;
}

export default function CompanionOnboarding({ onComplete }: CompanionOnboardingProps) {
  const handleGetStarted = () => {
    // Set companion disabled by default on first launch
    localStorage.setItem("cashtrack_selected_companion", "disabled");
    localStorage.setItem("cashtrack_companion_visibility", "disabled");
    localStorage.setItem("cashtrack_companion_onboarded", "true");
    
    window.dispatchEvent(new Event("cashtrack_companion_updated"));
    window.dispatchEvent(new Event("cashtrack_companion_settings_updated"));
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F8FA] dark:bg-[#171A23] flex flex-col items-center justify-center overflow-y-auto">
      <PageLayout isFullScreen px className="py-8 flex flex-col justify-between relative min-h-dvh max-w-lg w-full">
        
        {/* Top Header branding */}
        <div className="text-center pt-6 space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/40 rounded-full text-[10px] font-black uppercase tracking-widest text-[#8B5CF6] dark:text-purple-300"
          >
            <Sparkles size={12} /> CashTrack Student Build
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-black text-[#111111] dark:text-[#FFFFFF] tracking-tight leading-tight"
          >
            Master Your Money <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5CA8] via-[#8B5CF6] to-blue-600">
              With 70/20/10 Discipline
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs font-semibold text-gray-500 dark:text-[#C6CBD8] max-w-xs mx-auto leading-relaxed"
          >
            Track daily expenses, hit savings goals, and manage your budget with zero noise or ads.
          </motion.p>
        </div>

        {/* Hero Features List */}
        <div className="my-8 space-y-3 max-w-sm mx-auto w-full">
          {[
            {
              icon: PieChart,
              title: "70/20/10 Rule Allocation",
              desc: "Categorize spending into Needs (70%), Savings (20%), and Wants (10%).",
              color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-800/30"
            },
            {
              icon: Target,
              title: "Dedicated Savings Goals",
              desc: "Set piggy bank milestones and fund your dream items systematically.",
              color: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/30 border-pink-100 dark:border-pink-800/30"
            },
            {
              icon: TrendingUp,
              title: "Streak & Progress Tracking",
              desc: "Build consistency with daily expense logging and financial insights.",
              color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-800/30"
            },
            {
              icon: ShieldCheck,
              title: "100% Offline & Private",
              desc: "Your financial ledger stays safely stored right on your device.",
              color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800/30"
            }
          ].map((feat, idx) => {
            const IconComp = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + idx * 0.08 }}
                className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/10 p-3.5 rounded-[22px] shadow-sm flex items-start gap-3"
              >
                <div className={`p-2.5 rounded-2xl border ${feat.color} shrink-0 mt-0.5`}>
                  <IconComp size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#111111] dark:text-[#FFFFFF]">{feat.title}</h3>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-[#8B93A7] leading-normal mt-0.5">{feat.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pb-4 space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGetStarted}
            className="w-full bg-[#111111] dark:bg-[#8B5CF6] dark:hover:bg-[#7c4fe3] text-white py-4 rounded-[22px] text-xs font-black transition-colors shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            Enter Home Dashboard <ArrowRight size={16} />
          </motion.button>

          <p className="text-[10px] text-center font-bold text-gray-400 dark:text-[#8B93A7]">
            No sign up required ⚡ Instant setup
          </p>
        </div>

      </PageLayout>
    </div>
  );
}
