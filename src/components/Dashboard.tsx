import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, 
  AlertTriangle, 
  ChevronRight, 
  Trash2, 
  Bell, 
  Coffee, 
  Train, 
  ShieldAlert, 
  Pizza, 
  Film, 
  ShoppingBag, 
  PiggyBank, 
  CircleDot, 
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Target,
  Lightbulb,
  DollarSign,
  Plus,
  CheckCircle2,
  Calendar,
  Zap,
  Award,
  ShieldCheck,
  Compass,
  Smile,
  Check,
  X
} from "lucide-react";
import { SummaryData, Expense } from "../types";
import SavingsHub, { SavingsGoal } from "./SavingsHub";
import PageLayout from "./PageLayout";

interface DashboardProps {
  data: SummaryData | null;
  onRefresh: () => void;
  onOpenAddExpense: () => void;
  onNavigate?: (tab: "home" | "analysis" | "tools" | "profile") => void;
  onOpenStreakCenter?: () => void;
}

// Convert category name to professional rounded icon with vibrant gradient backdrops
export function getCategoryIcon(categoryName: string) {
  const norm = categoryName.toLowerCase();
  
  if (norm.includes("food ??essential") || norm.includes("essential tiffin")) {
    return (
      <div className="w-10 h-10 rounded-[16px] bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-500/20">
        <Coffee size={18} strokeWidth={2.2} />
      </div>
    );
  }
  if (norm.includes("travel") || norm.includes("metro") || norm.includes("rickshaw")) {
    return (
      <div className="w-10 h-10 rounded-[16px] bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-500 shadow-sm border border-purple-500/20">
        <Train size={18} strokeWidth={2.2} />
      </div>
    );
  }
  if (norm.includes("essentials") || norm.includes("mobile") || norm.includes("medicine") || norm.includes("notes")) {
    return (
      <div className="w-10 h-10 rounded-[16px] bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 shadow-sm border border-blue-500/20">
        <ShieldAlert size={18} strokeWidth={2.2} />
      </div>
    );
  }
  if (norm.includes("convenience") || norm.includes("zomato") || norm.includes("cafe")) {
    return (
      <div className="w-10 h-10 rounded-[16px] bg-[#FF5CA8]/10 dark:bg-[#FF5CA8]/20 flex items-center justify-center text-[#FF5CA8] shadow-sm border border-[#FF5CA8]/20">
        <Pizza size={18} strokeWidth={2.2} />
      </div>
    );
  }
  if (norm.includes("entertainment") || norm.includes("movie") || norm.includes("pool")) {
    return (
      <div className="w-10 h-10 rounded-[16px] bg-[#FF5CA8]/10 dark:bg-[#FF5CA8]/20 flex items-center justify-center text-[#FF5CA8] shadow-sm border border-[#FF5CA8]/20">
        <Film size={18} strokeWidth={2.2} />
      </div>
    );
  }
  if (norm.includes("impulse") || norm.includes("vending") || norm.includes("retail")) {
    return (
      <div className="w-10 h-10 rounded-[16px] bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-500 shadow-sm border border-rose-500/20">
        <ShoppingBag size={18} strokeWidth={2.2} />
      </div>
    );
  }
  if (norm.includes("savings") || norm.includes("mutual") || norm.includes("invest")) {
    return (
      <div className="w-10 h-10 rounded-[16px] bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm border border-amber-500/20">
        <PiggyBank size={18} strokeWidth={2.2} />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-[16px] bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-[#C6CBD8]">
      <CircleDot size={18} strokeWidth={2.2} />
    </div>
  );
}

const FAKE_DEFAULT_GOAL_ID = "goal_macbook_default";

// Load user savings goals from storage, ignoring the old hardcoded demo goal.
const loadSavingsGoals = (): SavingsGoal[] => {
  const saved = localStorage.getItem("cashtrack_savings_goals");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((g: SavingsGoal) => g.id !== FAKE_DEFAULT_GOAL_ID);
      }
    } catch (e) {}
  }
  return [];
};

export function Dashboard({ data, onRefresh, onOpenAddExpense, onNavigate, onOpenStreakCenter }: DashboardProps) {
  const [selectedBucketTab, setSelectedBucketTab] = useState<'Needs' | 'Wants' | 'Savings'>('Needs');
  const [selectedDetailBucket, setSelectedDetailBucket] = useState<'Needs' | 'Wants' | 'Savings' | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTooltipIdx, setActiveTooltipIdx] = useState<number | null>(null);
  const [isSavingsHubOpen, setIsSavingsHubOpen] = useState(false);
  const [initialCreateOpen, setInitialCreateOpen] = useState(false);

  // Savings Goals list state (no demo placeholders ??empty until the user adds one)
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(loadSavingsGoals);

  // Keep state updated in sync with external updates
  useEffect(() => {
    const loadGoals = () => {
      setSavingsGoals(loadSavingsGoals());
    };

    window.addEventListener("cashtrack_savings_goal_updated", loadGoals);
    window.addEventListener("storage", loadGoals);

    const handleOpenHub = (e: any) => {
      if (e.detail?.createOpen) {
        setInitialCreateOpen(true);
      } else {
        setInitialCreateOpen(false);
      }
      setIsSavingsHubOpen(true);
    };
    window.addEventListener("cashtrack_open_savings_hub" as any, handleOpenHub);

    return () => {
      window.removeEventListener("cashtrack_savings_goal_updated", loadGoals);
      window.removeEventListener("storage", loadGoals);
      window.removeEventListener("cashtrack_open_savings_hub" as any, handleOpenHub);
    };
  }, []);

  const activeGoals = savingsGoals.filter(g => !g.completed).sort((a, b) => a.priority - b.priority);
  const primaryGoal = activeGoals.length > 0 ? activeGoals[0] : null;

  // Monthly Challenge state with persistence (user-defined name + target)
  const [challengeConfig, setChallengeConfig] = useState<{ name: string; target: number } | null>(() => {
    const saved = localStorage.getItem("cashtrack_monthly_challenge");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === "string" && parsed.target > 0) {
          return { name: parsed.name, target: parsed.target };
        }
      } catch (e) {}
    }
    return null;
  });
  const [challengeDays, setChallengeDays] = useState(() => {
    const saved = localStorage.getItem("cashtrack_challenge_days");
    return saved ? parseInt(saved, 10) || 0 : 0;
  });
  const [isChallengeEditing, setIsChallengeEditing] = useState(false);
  const [challengeNameDraft, setChallengeNameDraft] = useState("");
  const [challengeTargetDraft, setChallengeTargetDraft] = useState("");

  const openChallengeEditor = () => {
    setChallengeNameDraft(challengeConfig?.name || "");
    setChallengeTargetDraft(String(challengeConfig?.target || 30));
    setIsChallengeEditing(true);
  };

  const saveChallenge = () => {
    const name = challengeNameDraft.trim();
    const target = Math.max(1, Math.min(90, parseInt(challengeTargetDraft, 10) || 30));
    if (!name) return;
    const config = { name, target };
    setChallengeConfig(config);
    localStorage.setItem("cashtrack_monthly_challenge", JSON.stringify(config));
    setIsChallengeEditing(false);
  };

  const cancelChallengeEditor = () => {
    setIsChallengeEditing(false);
  };

  const handleIncrementChallenge = () => {
    const target = challengeConfig?.target || 30;
    const next = Math.min(challengeDays + 1, target);
    setChallengeDays(next);
    localStorage.setItem("cashtrack_challenge_days", String(next));
    if (next === target) {
      window.dispatchEvent(new CustomEvent("cashtrack_companion_trigger", { detail: { type: "challenge_complete" } }));
    }
  };

  const handleResetChallenge = () => {
    setChallengeDays(0);
    localStorage.setItem("cashtrack_challenge_days", "0");
  };

  // Local storage profile state
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("cashtrack_profile");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      avatar: "??",
      name: "Arigato Student",
      username: "@arigato.stp",
      email: "arigato.stp@gmail.com",
      bio: "Sem 3 engineering student | Tracking tea tapri expenses, metro tickets, and mess bills with 70/20/10 discipline."
    };
  });

  const [profilePic, setProfilePic] = useState<string | null>(() => localStorage.getItem("cashtrack_profile_pic"));

  useEffect(() => {
    const saved = localStorage.getItem("cashtrack_profile");
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch (e) {}
    }

    const handleUpdate = () => {
      setProfilePic(localStorage.getItem("cashtrack_profile_pic"));
      const latestProfile = localStorage.getItem("cashtrack_profile");
      if (latestProfile) {
        try { setProfile(JSON.parse(latestProfile)); } catch (e) {}
      }
    };
    window.addEventListener("cashtrack_profile_pic_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("cashtrack_profile_pic_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  if (!data) {
    return (
      <div id="dashboard-skeleton" className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-[3.5px] border-[#ECECEC] border-t-[#FF5CA8] rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#707070] animate-pulse">Syncing financial metrics...</p>
      </div>
    );
  }

  const { totalSpend, monthlyBudget, bucketSummary, categorySummary, heatmap, weeklyTrend, recentTransactions, streak } = data;
  const hasLoggedToday = streak.logged_today;

  const activeBucket = bucketSummary.find((b) => b.bucket === selectedBucketTab) || {
    bucket: selectedBucketTab,
    amount: 0,
    targetPercentage: selectedBucketTab === 'Needs' ? 70 : selectedBucketTab === 'Wants' ? 20 : 10,
    relativePercentage: 0,
    limitPercentage: 0,
    isOverBudget: false,
    targetAmount: selectedBucketTab === 'Needs' ? monthlyBudget * 0.7 : selectedBucketTab === 'Wants' ? monthlyBudget * 0.2 : monthlyBudget * 0.1
  };

  const activeBucketTransactions = recentTransactions
    .filter((t) => t.bucket === selectedBucketTab)
    .slice(0, 4);

  const activeBucketCategories = categorySummary
    .filter((c) => c.bucket === selectedBucketTab);

  const handleToggleJustified = async (expense: Expense) => {
    setUpdatingId(expense.id);
    try {
      await fetch(`/api/expense/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          justified: !expense.justified,
          reviewed: true
        })
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cash expense?")) return;
    try {
      await fetch(`/api/expense/${id}`, { method: "DELETE" });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Compact Horizontal Circular Budget Cards
  const renderCircularProgress = (b: typeof bucketSummary[0]) => {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(b.limitPercentage, 100);
    const strokeDash = (pct / 100) * circumference;
    const strokeOffset = circumference - strokeDash;

    let gradientId = `grad-${b.bucket.toLowerCase()}`;
    let gradStart = "#10B981";
    let gradEnd = "#059669";

    if (b.bucket === 'Wants') {
      gradStart = "#FF5CA8";
      gradEnd = "#E04890";
    }
    if (b.bucket === 'Savings') {
      gradStart = "#8B5CF6";
      gradEnd = "#7C3AED";
    }

    return (
      <motion.div 
        key={b.bucket} 
        onClick={() => setSelectedDetailBucket(b.bucket as 'Needs' | 'Wants' | 'Savings')}
        whileHover={{ y: -3, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex flex-col items-center justify-center text-center gap-2 bg-white dark:bg-[#1D212D] p-3.5 sm:p-4 rounded-[18px] border border-black/[0.04] dark:border-white/[0.08] shadow-[0_8px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.35)] hover:border-black/10 dark:hover:border-white/[0.15] hover:shadow-[0_12px_28px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_12px_20px_rgba(0,0,0,0.4)] transition-colors duration-300 h-full w-full cursor-pointer select-none"
      >
        {/* Progress Ring */}
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradStart} />
                <stop offset="100%" stopColor={gradEnd} />
              </linearGradient>
            </defs>
            <circle 
              cx="28" 
              cy="28" 
              r={radius} 
              fill="none" 
              className="stroke-[#F0F2F6] dark:stroke-white/10" 
              strokeWidth="5" 
            />
            <motion.circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="5"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeOffset }}
              transition={{ duration: 1, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[11px] sm:text-[13px] font-black text-[#111111] dark:text-white font-mono leading-none">
              {Math.round(b.limitPercentage)}%
            </span>
          </div>
        </div>

        {/* Category Name & Amount ONLY */}
        <div className="flex flex-col items-center justify-center min-w-0 w-full">
          <h4 className="text-xs sm:text-sm font-black text-[#111111] dark:text-white tracking-tight leading-snug truncate">
            {b.bucket}
          </h4>
          <p className="text-[11px] sm:text-xs font-bold text-[#707070] dark:text-[#C6CBD8] font-mono mt-0.5 truncate">
            ₹{Math.round(b.amount).toLocaleString("en-IN")}
          </p>
        </div>
      </motion.div>
    );
  };

  // Line Chart
  const renderLineChart = () => {
    if (weeklyTrend.length === 0) return null;

    const values = weeklyTrend.map(d => d.amount);
    const maxVal = Math.max(...values, 800);
    const chartHeight = 120;
    const chartWidth = 360;
    const paddingX = 24;
    const paddingY = 16;

    const points = weeklyTrend.map((day, index) => {
      const x = paddingX + (index * (chartWidth - paddingX * 2)) / (weeklyTrend.length - 1);
      const y = chartHeight - paddingY - (day.amount / maxVal) * (chartHeight - paddingY * 2);
      return { x, y, day };
    });

    let pathD = "";
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const cpX1 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
        const cpY1 = points[i - 1].y;
        const cpX2 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
        const cpY2 = points[i].y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
      }
    }

    const fillD = pathD ? `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z` : "";

    return (
      <motion.div 
        whileHover={{ y: -2 }}
        className="bg-white dark:bg-[#1D212D] rounded-[24px] p-6 border border-[#ECECEC] dark:border-white/5 shadow-[0_8px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.4)] space-y-4 transition-colors duration-300"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FF5CA8]/10 text-[#FF5CA8] flex items-center justify-center">
              <TrendingUp size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#111111] dark:text-white">Weekly Spending Trend</h3>
              <p className="text-[10px] text-[#707070] dark:text-[#8B93A7] font-semibold">Daily transaction volume curve</p>
            </div>
          </div>
          <span className="text-[9px] font-black bg-[#FF5CA8]/10 text-[#FF5CA8] px-2.5 py-1 rounded-full border border-[#FF5CA8]/10 uppercase tracking-wider">
            7 Days
          </span>
        </div>

        <div className="relative pt-2">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5CA8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#FF5CA8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} className="stroke-[#ECECEC] dark:stroke-white/10" strokeDasharray="3 3" />
            <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} className="stroke-[#ECECEC] dark:stroke-white/10" strokeDasharray="3 3" />
            <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} className="stroke-[#ECECEC] dark:stroke-white/10" strokeDasharray="3 3" />

            {fillD && (
              <motion.path
                d={fillD}
                fill="url(#chartGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              />
            )}

            {pathD && (
              <motion.path
                d={pathD}
                fill="none"
                stroke="#FF5CA8"
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            )}

            {points.map((pt, idx) => (
              <g key={idx} className="cursor-pointer" onMouseEnter={() => setActiveTooltipIdx(idx)} onMouseLeave={() => setActiveTooltipIdx(null)}>
                <circle cx={pt.x} cy={pt.y} r="7" className="fill-[#FF5CA8]/20 stroke-none transition-transform hover:scale-125" />
                <circle cx={pt.x} cy={pt.y} r="3.5" className="fill-white dark:fill-[#1D212D] stroke-[#FF5CA8] stroke-[2.5]" />
              </g>
            ))}
          </svg>

          <div className="h-6 mt-2 flex justify-between items-center text-[10px] font-bold text-[#707070] dark:text-[#C6CBD8] px-2">
            {activeTooltipIdx !== null ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex justify-between items-center bg-[#F8F8FA] dark:bg-[#202534] px-3 py-1.5 rounded-lg border border-[#ECECEC] dark:border-white/10"
              >
                <span className="text-gray-900 dark:text-white font-bold">{points[activeTooltipIdx].day.date}:</span>
                <span className="text-[#FF5CA8] font-black font-mono">₹{points[activeTooltipIdx].day.amount.toLocaleString("en-IN")}</span>
              </motion.div>
            ) : (
              <div className="flex justify-between w-full">
                <span>{weeklyTrend[0]?.label}</span>
                <span className="text-[9px] font-semibold text-[#707070] dark:text-[#8B93A7]">Hover node to inspect volume</span>
                <span>{weeklyTrend[weeklyTrend.length - 1]?.label}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  };

  // Insights helper
  const getInsights = () => {
    const foodSpend = categorySummary.find(c => c.category.toLowerCase().includes("food"))?.amount || 0;
    const impulseSpend = categorySummary.find(c => c.category.toLowerCase().includes("impulse"))?.amount || 0;
    
    if (foodSpend > monthlyBudget * 0.25) {
      return {
        text: "Food & Cafe expenses increased recently.",
        sub: "Tea tapri runs and cafe splits are pushing your Wants allocation.",
        type: "warning"
      };
    }
    if (impulseSpend > 500) {
      return {
        text: "Smart discipline detected!",
        sub: "Avoiding extra impulse purchases saved your budget ₹1,200 this week.",
        type: "success"
      };
    }
    return {
      text: "70/20/10 Budget discipline is healthy.",
      sub: "Needs, Wants, and Savings are maintained in ideal ratio.",
      type: "success"
    };
  };

  const insight = getInsights();

  return (
    <PageLayout id="dashboard-viewport" className="space-y-6 animate-fadeIn">
      {/* Header Profile Summary */}
      <div id="dashboard-header" className="flex justify-between items-center py-2">
        <div className="flex items-center gap-3">
          <div className="p-[2px] rounded-full bg-[#FF5CA8] shadow-sm">
            <div className="w-11 h-11 rounded-full bg-white dark:bg-[#171A23] flex items-center justify-center text-xl select-none overflow-hidden">
              {profilePic ? (
                <motion.img
                  key={profilePic}
                  src={profilePic}
                  alt="Profile"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Smile size={20} strokeWidth={2} className="text-[#FF5CA8]" />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-[#111111] dark:text-white tracking-tight">Hello, {profile.name.split(" ")[0]}</h1>
              <span className="text-[9px] font-bold text-white bg-[#FF5CA8]/80 rounded-full px-1.5 py-0.5 tracking-wide select-none">v5</span>
            </div>
            <p className="text-[10px] font-bold text-[#707070] dark:text-[#C6CBD8] uppercase tracking-wider">{getFormattedDate()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Daily Streak Badge */}
          <motion.div
            id="dashboard-streak-badge"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onOpenStreakCenter?.()}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border cursor-pointer select-none transition-colors duration-300 shadow-sm ${
              hasLoggedToday
                ? "bg-[#FF5CA8]/15 border-[#FF5CA8]/30 text-[#FF5CA8]"
                : "bg-[#F8F8FA] dark:bg-[#171A23] border-[#ECECEC] dark:border-white/10 text-[#707070] dark:text-[#C6CBD8]"
            }`}
          >
            <Flame size={14} className={hasLoggedToday ? "fill-[#FF5CA8] text-[#FF5CA8] animate-bounce" : "opacity-40"} />
            <span className="text-[10px] font-black font-mono">{streak.current_streak}d streak</span>
          </motion.div>

          {/* Savings Hub trigger */}
          <button
            onClick={() => {
              setInitialCreateOpen(false);
              setIsSavingsHubOpen(true);
            }}
            className="w-9 h-9 rounded-full bg-white dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 flex items-center justify-center text-[#111111] dark:text-white hover:bg-purple-500/10 hover:border-purple-500/30 cursor-pointer transition-colors active:scale-95 shadow-sm"
            title="Open Savings Goals Hub"
          >
            <Target size={15} className="text-[#8B5CF6]" />
          </button>
        </div>
      </div>

      {/* 1. Spending Insights Alert Banner */}
      <motion.div 
        whileHover={{ y: -1 }}
        className={`p-4 rounded-[20px] border flex gap-3.5 items-start shadow-sm transition-colors duration-300 ${
          insight.type === "warning" 
            ? "bg-rose-500/5 border-rose-500/20 text-rose-500" 
            : "bg-emerald-500/5 border-emerald-500/20 text-emerald-500"
        }`}
      >
        <div className={`p-2 rounded-xl shrink-0 ${insight.type === "warning" ? "bg-rose-500/10" : "bg-emerald-500/10"}`}>
          <Lightbulb size={18} strokeWidth={2.2} />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-black tracking-tight text-[#111111] dark:text-white">{insight.text}</h4>
          <p className="text-[11px] font-semibold text-[#707070] dark:text-[#C6CBD8] leading-normal">{insight.sub}</p>
        </div>
      </motion.div>

      {/* 2. Monthly Hero Summary Card */}
      <motion.div 
        id="monthly-spend-card" 
        whileHover={{ y: -2 }}
        className="bg-white dark:bg-[#1D212D] rounded-[28px] border border-[#ECECEC] dark:border-white/5 p-6 space-y-5 shadow-[0_8px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.4)] relative overflow-hidden transition-colors duration-300"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF5CA8]/5 rounded-bl-full pointer-events-none" />

        <div className="flex justify-between items-start relative z-10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#707070] dark:text-[#8B93A7] flex items-center gap-1.5">
              <DollarSign size={13} className="text-[#FF5CA8]" /> Total Monthly Outlay
            </span>
            <div className="text-3xl font-black text-[#111111] dark:text-white tracking-tight mt-1.5 flex items-baseline gap-1 font-mono">
              <span className="text-lg font-bold text-[#707070] dark:text-[#8B93A7]">₹</span>
              {Math.round(totalSpend).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="bg-[#F8F8FA] dark:bg-[#171A23] px-3.5 py-2 rounded-[16px] border border-[#ECECEC] dark:border-white/10 text-[10px] text-right">
            <span className="text-[#707070] dark:text-[#8B93A7] font-bold block uppercase tracking-wider text-[8px]">Monthly Cap</span>
            <span className="text-[#111111] dark:text-white font-black text-xs font-mono">₹{Math.round(monthlyBudget).toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Progress Bar & Overrun Warnings */}
        <div className="space-y-3 relative z-10">
          <div className="w-full bg-[#F8F8FA] dark:bg-[#2B3040] rounded-full h-3.5 overflow-hidden p-[2px] border border-[#ECECEC] dark:border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totalSpend / monthlyBudget) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                totalSpend > monthlyBudget ? "bg-rose-500" : "bg-[#FF5CA8]"
              }`}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-semibold text-[#707070] dark:text-[#C6CBD8]">
            <span className="text-[#111111] dark:text-white font-bold">{Math.round((totalSpend / monthlyBudget) * 100)}% Consumed</span>
            {totalSpend > monthlyBudget ? (
              <span className="text-rose-500 flex items-center gap-1 font-black animate-pulse bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                <AlertTriangle size={12} /> Cap Exceeded!
              </span>
            ) : (
              <span>
                Remaining limit: <span className="text-[#111111] dark:text-white font-black font-mono">₹{Math.round(monthlyBudget - totalSpend).toLocaleString("en-IN")}</span>
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* 3. Interactive Bento Grid: Savings Goal & Monthly Challenge (Side-by-side 2-column grid) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Savings Goal Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="bg-[#1C2230] border border-white/[0.08] rounded-[22px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-colors duration-200"
        >
          {primaryGoal ? (
            <div className="flex flex-col justify-between h-full space-y-3">
              {/* Top: Icon & Title */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center shrink-0">
                  <PiggyBank size={14} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8B93A7] truncate">Saving Goal</span>
              </div>

              {/* Middle: Name & Amounts */}
              <div className="space-y-1">
                <h4 className="text-xs font-black text-white truncate">{primaryGoal.name}</h4>
                <div className="text-[11px] font-bold text-[#C6CBD8] font-mono truncate">
                  ₹{primaryGoal.current.toLocaleString("en-IN")} / ₹{primaryGoal.target.toLocaleString("en-IN")}
                </div>
              </div>

              {/* Bottom: Progress Bar & Percentage */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[10px] font-black font-mono">
                  <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-[9px] truncate">
                    {primaryGoal.status}
                  </span>
                  <span className="text-[#8B5CF6]">
                    {Math.round((primaryGoal.current / primaryGoal.target) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-[#171A23] rounded-full h-1.5 overflow-hidden border border-white/5">
                  <div 
                    className="bg-[#8B5CF6] h-full rounded-full transition-colors duration-500" 
                    style={{ width: `${Math.min(100, Math.round((primaryGoal.current / primaryGoal.target) * 100))}%` }} 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between h-full text-center py-2 space-y-3">
              <div className="space-y-1">
                <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] mx-auto flex items-center justify-center">
                  <PiggyBank size={16} />
                </div>
                <h4 className="text-xs font-black text-white">Saving Goal</h4>
                <p className="text-[9px] text-[#8B93A7] font-semibold">No active goal</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setInitialCreateOpen(true);
                  setIsSavingsHubOpen(true);
                }} 
                className="w-full bg-[#8B5CF6] hover:bg-purple-700 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shadow-sm active:scale-95"
              >
                + Add Goal
              </button>
            </div>
          )}
        </motion.div>

        {/* Monthly Challenge Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="bg-[#1C2230] border border-white/[0.08] rounded-[22px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-colors duration-200"
        >
          {isChallengeEditing ? (
            <div className="flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FF5CA8]/15 text-[#FF5CA8] flex items-center justify-center shrink-0">
                  <Flame size={14} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8B93A7] truncate">Monthly Challenge</span>
              </div>

              <div className="space-y-2">
                <input
                  value={challengeNameDraft}
                  onChange={(e) => setChallengeNameDraft(e.target.value)}
                  placeholder="Challenge name (e.g., No Delivery)"
                  className="w-full bg-[#171A23] border border-white/10 rounded-xl px-2.5 py-2 text-[10px] font-bold text-white placeholder:text-[#8B93A7] outline-none focus:border-[#FF5CA8]"
                />
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={challengeTargetDraft}
                  onChange={(e) => setChallengeTargetDraft(e.target.value)}
                  placeholder="Target days"
                  className="w-full bg-[#171A23] border border-white/10 rounded-xl px-2.5 py-2 text-[10px] font-bold text-white placeholder:text-[#8B93A7] outline-none focus:border-[#FF5CA8]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveChallenge}
                    className="flex-1 bg-[#FF5CA8] hover:bg-[#ff3c96] text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shadow-sm active:scale-95"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelChallengeEditor}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-[#C6CBD8] border border-white/10 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
                {challengeDays > 0 && (
                  <button
                    type="button"
                    onClick={() => { handleResetChallenge(); }}
                    className="w-full text-[9px] font-black uppercase tracking-wider text-[#8B93A7] hover:text-[#FF5CA8] bg-white/5 hover:bg-white/10 border border-white/10 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Reset Progress ({challengeDays} day{challengeDays > 1 ? "s" : ""})
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between h-full space-y-3">
              {/* Top: Icon & Title */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-[#FF5CA8]/15 text-[#FF5CA8] flex items-center justify-center shrink-0">
                    <Flame size={14} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#8B93A7] truncate">Monthly Challenge</span>
                </div>
                <button
                  type="button"
                  onClick={openChallengeEditor}
                  className="shrink-0 text-[8px] font-black uppercase tracking-wider text-[#8B93A7] hover:text-[#FF5CA8] bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {/* Middle: Name & Days */}
              <div className="space-y-1">
                <h4 className="text-xs font-black text-white truncate">{challengeConfig ? challengeConfig.name : "No challenge set"}</h4>
                <div className="text-[11px] font-bold text-[#C6CBD8] font-mono">
                  {challengeConfig ? `${challengeDays} / ${challengeConfig.target} Days` : "Set your own goal"}
                </div>
              </div>

              {/* Bottom: Progress Bar & Log Button */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-[10px] font-black font-mono">
                  <span className="text-[#8B93A7] text-[9px]">Streak Target</span>
                  <span className="text-[#FF5CA8]">
                    {challengeConfig ? Math.round((challengeDays / challengeConfig.target) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-[#171A23] rounded-full h-1.5 overflow-hidden border border-white/5">
                  <div className="h-full bg-[#FF5CA8] rounded-full transition-colors duration-500" style={{ width: `${challengeConfig ? Math.min(100, Math.round((challengeDays / challengeConfig.target) * 100)) : 0}%` }} />
                </div>

                {challengeConfig ? (
                  <button
                    type="button"
                    onClick={handleIncrementChallenge}
                    disabled={challengeDays >= challengeConfig.target}
                    className="w-full bg-[#FF5CA8] hover:bg-[#ff3c96] disabled:bg-white/10 disabled:text-[#8B93A7] text-white py-2 rounded-xl text-[10px] font-black transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer active:scale-95"
                  >
                    <Plus size={12} /> {challengeDays >= challengeConfig.target ? "Completed" : "Log Day"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openChallengeEditor}
                    className="w-full bg-[#FF5CA8] hover:bg-[#ff3c96] text-white py-2 rounded-xl text-[10px] font-black transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer active:scale-95"
                  >
                    <Plus size={12} /> Set Challenge
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* 4. Spend volume line trend */}
      {renderLineChart()}

      {/* 5. Circular Budget Rings Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#707070] dark:text-[#8B93A7]">Budget Allocation Progress</h3>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 items-stretch">
          {bucketSummary.map((b) => renderCircularProgress(b))}
        </div>
      </div>

      {/* 6. Budget Segmentation Drawer (Tab details card) */}
      <div id="bucket-tabs-card" className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 rounded-[28px] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
        {/* Segmented Tab Buttons */}
        <div className="p-2 bg-[#F8F8FA] dark:bg-[#171A23] border-b border-[#ECECEC] dark:border-white/10">
          <div className="relative flex rounded-[18px] gap-1">
            {(['Needs', 'Wants', 'Savings'] as const).map((b) => {
              const isActive = selectedBucketTab === b;
              const targetLabel = b === 'Needs' ? '70%' : b === 'Wants' ? '20%' : '10%';
              
              let activeColorText = "text-emerald-500";
              let activePillBg = "bg-white dark:bg-[#202534] border-[#ECECEC] dark:border-white/10 shadow-sm";
              if (b === 'Wants') activeColorText = "text-[#FF5CA8]";
              if (b === 'Savings') activeColorText = "text-[#8B5CF6]";

              return (
                <button
                  key={b}
                  onClick={() => setSelectedBucketTab(b)}
                  className={`relative flex-1 py-2.5 rounded-[14px] text-xs font-bold cursor-pointer text-center transition-colors duration-200 outline-none flex flex-col items-center justify-center ${
                    isActive ? `${activeColorText} ${activePillBg}` : "text-[#707070] dark:text-[#8B93A7] hover:text-[#111111] dark:hover:text-white"
                  }`}
                >
                  <span className="font-black">{b}</span>
                  <span className="text-[8px] opacity-70 block tracking-wider uppercase">Target {targetLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab contents */}
        <div className="p-6 space-y-5">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#707070] dark:text-[#8B93A7]">Active Bucket Pool</span>
              <div className="text-2xl font-black text-[#111111] dark:text-white mt-1 font-mono">
                ₹{activeBucket.amount.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="text-right text-[10px] font-semibold text-[#707070] dark:text-[#C6CBD8]">
              Max Target: <span className="text-[#111111] dark:text-white font-black font-mono">₹{Math.round(activeBucket.targetAmount).toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Sub-categories progress details */}
          {activeBucketCategories.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#707070] dark:text-[#8B93A7]">Category Breakdown</h4>
              <div className="space-y-3">
                {activeBucketCategories.map((cat, idx) => {
                  let barColor = "bg-emerald-500";
                  if (selectedBucketTab === "Wants") barColor = "bg-[#FF5CA8]";
                  if (selectedBucketTab === "Savings") barColor = "bg-[#8B5CF6]";

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#111111] dark:text-white font-semibold flex items-center gap-2">
                          {getCategoryIcon(cat.category)}
                          {cat.category.replace("Food ??", "")}
                        </span>
                        <span className="text-[#111111] dark:text-white font-black font-mono">₹{Math.round(cat.amount).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="w-full bg-[#F8F8FA] dark:bg-[#2B3040] h-2 rounded-full overflow-hidden border border-[#ECECEC] dark:border-white/10">
                        <div className={`h-full ${barColor}`} style={{ width: `${Math.min(cat.percentage, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Small ledger list of active logs */}
          <div className="space-y-3 pt-4 border-t border-[#ECECEC] dark:border-white/10">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#707070] dark:text-[#8B93A7]">Top {selectedBucketTab} Transactions</h4>
            {activeBucketTransactions.length > 0 ? (
              <div className="space-y-2">
                {activeBucketTransactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center bg-[#F8F8FA] dark:bg-[#171A23] p-3 rounded-[16px] border border-[#ECECEC] dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                      {getCategoryIcon(tx.category)}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-[#111111] dark:text-white font-mono">₹{tx.amount}</span>
                          <span className="text-[10px] text-[#707070] dark:text-[#C6CBD8] font-bold uppercase tracking-wider">{tx.category.replace("Food ??", "")}</span>
                        </div>
                        {tx.note && <span className="text-[10px] text-[#707070] dark:text-[#8B93A7]">₹{tx.note}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#707070] dark:text-[#8B93A7]">
                      {tx.date.substring(5)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#707070]/60 dark:text-[#8B93A7]/60 italic py-1 font-medium">No logs categorized under {selectedBucketTab} yet</div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Recent Ledger Records */}
      <div id="recent-ledger" className="space-y-3.5">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#707070] dark:text-[#8B93A7]">Recent Cash Ledger Entries</h3>
          <span className="text-[10px] font-bold text-[#707070] dark:text-[#8B93A7]">{recentTransactions.length} items</span>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.slice(0, 5).map((tx) => {
              let bucketStyle = "border-emerald-500/20 text-emerald-500 bg-emerald-500/10";
              if (tx.bucket === 'Wants') bucketStyle = "border-[#FF5CA8]/20 text-[#FF5CA8] bg-[#FF5CA8]/10";
              if (tx.bucket === 'Savings') bucketStyle = "border-[#8B5CF6]/20 text-[#8B5CF6] bg-[#8B5CF6]/10";

              return (
                <motion.div
                  key={tx.id}
                  whileHover={{ y: -2 }}
                  className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 rounded-[24px] p-5 flex flex-col space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.4)] hover:border-[#FF5CA8]/30 transition-colors duration-300 animate-fadeIn"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {getCategoryIcon(tx.category)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-[#111111] dark:text-white font-mono">₹{tx.amount}</span>
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full border ${bucketStyle} font-extrabold tracking-wider uppercase`}>
                            {tx.category.replace("Food ??", "")}
                          </span>
                        </div>
                        {tx.note ? (
                          <p className="text-xs text-[#111111] dark:text-[#C6CBD8] italic font-semibold">"{tx.note}"</p>
                        ) : (
                          <p className="text-[10px] text-[#707070] dark:text-[#8B93A7] font-medium">Logged entry</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-[10px] font-bold text-[#707070] dark:text-[#8B93A7]">{tx.date}</span>
                      <button
                        onClick={() => handleDeleteExpense(tx.id)}
                        className="text-gray-400 dark:text-gray-500 hover:text-rose-500 p-1.5 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                        title="Delete log"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Reflection Card Footer */}
                  <div className="border-t border-[#ECECEC]/60 dark:border-white/10 pt-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#707070] dark:text-[#8B93A7]">Reflection:</span>
                      <span
                        className={`text-[9px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                          tx.reviewed
                            ? tx.justified
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            : "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-400"
                        }`}
                      >
                        {tx.reviewed ? (tx.justified ? "Justified" : "Avoidable") : "Pending"}
                      </span>
                    </div>

                    <button
                      disabled={updatingId === tx.id}
                      onClick={() => handleToggleJustified(tx)}
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-[12px] transition-colors cursor-pointer active:scale-95 ${
                        tx.justified
                          ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20"
                          : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20"
                      }`}
                    >
                      {updatingId === tx.id ? (
                        "Saving..."
                      ) : tx.justified ? (
                        "Mark Avoidable"
                      ) : (
                        "Mark Justified"
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 rounded-[24px] p-8 text-center text-[#707070] dark:text-[#C6CBD8] text-sm shadow-[0_8px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.4)] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FF5CA8]/10 text-[#FF5CA8] mx-auto flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="font-black text-sm text-[#111111] dark:text-white">Start your first expense entry today</p>
              <p className="text-xs text-[#707070] dark:text-[#8B93A7] mt-1 font-semibold">Log today's cash entries to build your streak and stay under budget.</p>
            </div>
            <button
              onClick={onOpenAddExpense}
              className="px-4 py-2 bg-[#FF5CA8] hover:bg-[#ff3c96] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} /> Log Cash Entry
            </button>
          </div>
        )}
      </div>

      {/* 8. Savings Goals Hub Full Screen Overlay */}
      <AnimatePresence>
        {isSavingsHubOpen && (
          <SavingsHub 
            onClose={() => setIsSavingsHubOpen(false)}
            data={data}
            onRefresh={onRefresh}
            initialCreateOpen={initialCreateOpen}
          />
        )}

        {/* 9. Budget Bucket Details Bottom Sheet */}
        {selectedDetailBucket && (() => {
          const detailBucketData = bucketSummary.find(b => b.bucket === selectedDetailBucket);
          if (!detailBucketData) return null;

          const detailCategories = categorySummary.filter(c => c.bucket === selectedDetailBucket);
          const detailTransactions = recentTransactions.filter(t => t.bucket === selectedDetailBucket).slice(0, 6);
          const remainingAmount = detailBucketData.targetAmount - detailBucketData.amount;

          return (
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedDetailBucket(null)}
                className="absolute inset-0 bg-black/60 cursor-pointer"
              />

              {/* Bottom Sheet Drawer */}
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#1D212D] border-t border-x border-[#ECECEC] dark:border-white/10 rounded-t-[28px] p-5 sm:p-6 shadow-2xl z-10 max-h-[85vh] overflow-y-auto space-y-5"
              >
                {/* Swipe Handle Indicator */}
                <div className="w-12 h-1 bg-gray-300 dark:bg-white/20 rounded-full mx-auto -mt-1 mb-1" />

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-[#111111] dark:text-white tracking-tight">
                        {detailBucketData.bucket} Budget
                      </h3>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        selectedDetailBucket === 'Needs' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                        selectedDetailBucket === 'Wants' ? 'bg-[#FF5CA8]/10 text-[#FF5CA8] dark:text-[#FF7DBB] border border-[#FF5CA8]/20' :
                        'bg-[#8B5CF6]/10 text-[#8B5CF6] dark:text-[#A78BFA] border border-[#8B5CF6]/20'
                      }`}>
                        {detailBucketData.targetPercentage}% Target
                      </span>
                    </div>
                    <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold mt-0.5">
                      Detailed breakdown & progress tracking
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDetailBucket(null)}
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Progress Bar Section */}
                <div className="space-y-2 bg-[#F8F8FA] dark:bg-[#2B3040] p-4 rounded-[20px] border border-[#ECECEC] dark:border-white/5">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-[#111111] dark:text-white">Budget Utilization</span>
                    <span className="font-mono text-[#707070] dark:text-[#C6CBD8]">
                      {Math.round(detailBucketData.limitPercentage)}% Used
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-white/10 h-3 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, detailBucketData.limitPercentage)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full ${
                        selectedDetailBucket === 'Needs' ? 'bg-emerald-500' :
                        selectedDetailBucket === 'Wants' ? 'bg-[#FF5CA8]' :
                        'bg-[#8B5CF6]'
                      }`}
                    />
                  </div>
                </div>

                {/* 3 Metrics Grid: Target, Spent, Remaining */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Budget Target */}
                  <div className="bg-[#F8F8FA] dark:bg-[#2B3040] p-3 rounded-[16px] border border-[#ECECEC] dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider block">
                      Target
                    </span>
                    <p className="text-xs sm:text-sm font-black font-mono text-[#111111] dark:text-white truncate">
                      ₹{Math.round(detailBucketData.targetAmount).toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Amount Spent */}
                  <div className="bg-[#F8F8FA] dark:bg-[#2B3040] p-3 rounded-[16px] border border-[#ECECEC] dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider block">
                      Spent
                    </span>
                    <p className="text-xs sm:text-sm font-black font-mono text-[#111111] dark:text-white truncate">
                      ₹{Math.round(detailBucketData.amount).toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Remaining Balance */}
                  <div className="bg-[#F8F8FA] dark:bg-[#2B3040] p-3 rounded-[16px] border border-[#ECECEC] dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider block">
                      Remaining
                    </span>
                    <p className={`text-xs sm:text-sm font-black font-mono truncate ${
                      detailBucketData.isOverBudget 
                        ? "text-rose-500" 
                        : "text-emerald-500"
                    }`}>
                      ₹{Math.max(0, Math.round(remainingAmount)).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#707070] dark:text-[#8B93A7]">
                    Category Breakdown
                  </h4>
                  {detailCategories.length > 0 ? (
                    <div className="space-y-2">
                      {detailCategories.map((c) => {
                        const pct = detailBucketData.amount > 0 ? (c.amount / detailBucketData.amount) * 100 : 0;
                        return (
                          <div 
                            key={c.category}
                            className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-3 rounded-[16px] border border-[#ECECEC] dark:border-white/5"
                          >
                            <div className="flex items-center gap-3">
                              {getCategoryIcon(c.category)}
                              <div>
                                <p className="text-xs font-black text-[#111111] dark:text-white">{c.category}</p>
                                <p className="text-[10px] text-[#707070] dark:text-[#8B93A7] font-semibold">{Math.round(pct)}% of {selectedDetailBucket} spend</p>
                              </div>
                            </div>
                            <span className="text-xs font-black font-mono text-[#111111] dark:text-white">
                              ₹{Math.round(c.amount).toLocaleString("en-IN")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#707070] dark:text-[#8B93A7] font-semibold italic">
                      No category expense logged yet for {selectedDetailBucket}.
                    </p>
                  )}
                </div>

                {/* Recent Transactions */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#707070] dark:text-[#8B93A7]">
                    Recent {selectedDetailBucket} Transactions
                  </h4>
                  {detailTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {detailTransactions.map((tx) => (
                        <div 
                          key={tx.id}
                          className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-3 rounded-[16px] border border-[#ECECEC] dark:border-white/5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {getCategoryIcon(tx.category)}
                            <div className="min-w-0">
                              <p className="text-xs font-black text-[#111111] dark:text-white truncate">{tx.note || tx.category}</p>
                              <p className="text-[10px] text-[#707070] dark:text-[#8B93A7] font-semibold font-mono">{tx.date}</p>
                            </div>
                          </div>
                          <span className="text-xs font-black font-mono text-[#111111] dark:text-white shrink-0">
                            ₹{Math.round(tx.amount).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#707070] dark:text-[#8B93A7] font-semibold italic">
                      No transactions recorded for this bucket yet.
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </PageLayout>
  );
}

export default React.memo(Dashboard);

