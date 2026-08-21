import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, MessageSquare, Camera } from "lucide-react";
import { Streak } from "../types";
import { CATEGORIES } from "../constants/categories";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (streak: Streak, milestoneReached: boolean, milestoneValue: number) => void;
}

export default function AddExpenseModal({ isOpen, onClose, onSuccess }: AddExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [receiptAttached, setReceiptAttached] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Active Savings Goals state for Intelligent Allocation Panel
  const [activeGoals, setActiveGoals] = useState<any[]>([]);
  const [splitMode, setSplitMode] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [syncToGoals, setSyncToGoals] = useState(true);
  const [autoSplitType, setAutoSplitType] = useState<"equal" | "priority" | "smallest">("equal");

  // Sync active goals from localStorage whenever modal opens & Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      const saved = localStorage.getItem("cashtrack_savings_goals");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const active = parsed.filter(g => !g.completed);
            setActiveGoals(active);
            if (active.length > 0) {
              setSelectedGoalId(active[0].id);
            }
          } else {
            setActiveGoals([]);
          }
        } catch (e) {
          setActiveGoals([]);
        }
      } else {
        setActiveGoals([]);
      }
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  const runAutoAllocation = (type: "equal" | "priority" | "smallest", totalVal: number, goalsList: any[]) => {
    if (goalsList.length === 0) return {};
    const total = parseFloat(totalVal as any) || 0;
    if (total <= 0) return {};

    const newAllocations: Record<string, number> = {};

    if (type === "equal") {
      const share = Number((total / goalsList.length).toFixed(2));
      goalsList.forEach((g, idx) => {
        if (idx === goalsList.length - 1) {
          const sumOfOthers = share * (goalsList.length - 1);
          newAllocations[g.id] = Number((total - sumOfOthers).toFixed(2));
        } else {
          newAllocations[g.id] = share;
        }
      });
    } else if (type === "priority") {
      const weights = goalsList.map(g => 1 / (g.priority || 1));
      const totalWeight = weights.reduce((s, w) => s + w, 0);
      
      let allocatedSoFar = 0;
      goalsList.forEach((g, idx) => {
        const weight = 1 / (g.priority || 1);
        if (idx === goalsList.length - 1) {
          newAllocations[g.id] = Number((total - allocatedSoFar).toFixed(2));
        } else {
          const share = Number((total * (weight / totalWeight)).toFixed(2));
          newAllocations[g.id] = share;
          allocatedSoFar += share;
        }
      });
    } else if (type === "smallest") {
      let remainingToAllocate = total;
      const sortedByGap = [...goalsList].sort((a, b) => {
        const gapA = a.target - a.current;
        const gapB = b.target - b.current;
        return gapA - gapB;
      });

      sortedByGap.forEach((g, idx) => {
        const gap = g.target - g.current;
        if (remainingToAllocate <= 0) {
          newAllocations[g.id] = 0;
        } else if (idx === sortedByGap.length - 1) {
          newAllocations[g.id] = Number(remainingToAllocate.toFixed(2));
          remainingToAllocate = 0;
        } else if (remainingToAllocate >= gap) {
          newAllocations[g.id] = Number(gap.toFixed(2));
          remainingToAllocate -= gap;
        } else {
          newAllocations[g.id] = Number(remainingToAllocate.toFixed(2));
          remainingToAllocate = 0;
        }
      });
    }

    return newAllocations;
  };

  // Re-run auto-allocation dynamically when total amount changes
  useEffect(() => {
    if (category === "Savings/Investment" && splitMode && activeGoals.length > 1) {
      const totalVal = parseFloat(amount) || 0;
      if (totalVal > 0) {
        const allocs = runAutoAllocation(autoSplitType || "equal", totalVal, activeGoals);
        setAllocations(allocs);
      } else {
        setAllocations({});
      }
    }
  }, [amount, splitMode, autoSplitType, activeGoals, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid cash amount");
      return;
    }
    if (!category) {
      setError("Please select a budget sector category");
      return;
    }

    if (category === "Savings/Investment" && syncToGoals && activeGoals.length > 0) {
      if (activeGoals.length > 1 && splitMode) {
        const totalAllocated = Object.values(allocations).reduce((s: number, v: number) => s + v, 0) as number;
        const diff = Math.abs(parseFloat(amount) - totalAllocated);
        if (diff >= 0.05) {
          setError("Goal allocations must sum up to the exact transaction amount");
          return;
        }
      } else if (activeGoals.length > 1 && !splitMode) {
        if (!selectedGoalId) {
          setError("Please select a recipient savings goal");
          return;
        }
      }
    }

    setLoading(true);
    try {
      const response = await fetch("/api/expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category,
          note,
          date,
          timestamp: new Date(`${date}T12:00:00`).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save expense to ledger");
      }

      const result = await response.json();
      if (result.success) {
        // If savings goal synchronization is active, update goals in localStorage
        if (category === "Savings/Investment" && syncToGoals && activeGoals.length > 0) {
          // Fetch full list of goals (completed & active) from localStorage
          const savedGoalsRaw = localStorage.getItem("cashtrack_savings_goals") || "[]";
          let allGoals: any[] = [];
          try { allGoals = JSON.parse(savedGoalsRaw); } catch(err){}

          const completedListRaw = localStorage.getItem("cashtrack_completed_goals") || "[]";
          let completedGoalsList: any[] = [];
          try { completedGoalsList = JSON.parse(completedListRaw); } catch(err){}

          // Let's gather allocations to apply
          let allocationsToApply: Record<string, number> = {};
          if (activeGoals.length === 1) {
            allocationsToApply[activeGoals[0].id] = parseFloat(amount);
          } else if (!splitMode) {
            allocationsToApply[selectedGoalId] = parseFloat(amount);
          } else {
            allocationsToApply = allocations;
          }

          // We also need to award Coins and XP: 50 XP and 25 Coins per deposit
          let xpGained = 50;
          let coinsGained = 25;
          const currentXp = parseInt(localStorage.getItem("cashtrack_xp") || "350", 10);
          const currentCoins = parseInt(localStorage.getItem("cashtrack_coins") || "120", 10);
          localStorage.setItem("cashtrack_xp", String(currentXp + xpGained));
          localStorage.setItem("cashtrack_coins", String(currentCoins + coinsGained));

          // Create transaction histories inside localStorage for goals
          const savedHistoryRaw = localStorage.getItem("cashtrack_savings_history") || "[]";
          let savingsHistory: any[] = [];
          try { savingsHistory = JSON.parse(savedHistoryRaw); } catch (e) {}

          const todayStr = new Date().toISOString().split("T")[0];

          // Track completed goals to trigger celebration dialogues
          const completedGoalsThisTurn: any[] = [];

          // Apply allocations
          allGoals = allGoals.map(g => {
            const alloc = allocationsToApply[g.id];
            if (alloc && alloc > 0) {
              const newCurrent = Math.min(g.current + alloc, g.target);
              const isCompleted = newCurrent >= g.target;

              // Record transaction history for this goal
              savingsHistory.push({
                id: "tx_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
                goalId: g.id,
                goalName: g.name,
                amount: alloc,
                date: todayStr,
                type: "deposit",
                notes: note || "Savings Pool Outlay deposit"
              });

              const updatedGoal = {
                ...g,
                current: newCurrent,
                completed: isCompleted,
                completionDate: isCompleted ? todayStr : g.completionDate,
                status: isCompleted ? "Ready to Complete" : g.status
              };

              if (isCompleted) {
                completedGoalsThisTurn.push(updatedGoal);
              }

              return updatedGoal;
            }
            return g;
          });

          // Filter out newly completed goals from active list, and push to completed archive
          const activeGoalsRemaining = allGoals.filter(g => !g.completed);
          const newlyCompletedGoals = allGoals.filter(g => g.completed && !completedGoalsList.some(cg => cg.id === g.id));

          completedGoalsList = [...newlyCompletedGoals, ...completedGoalsList];

          // Persist to localStorage
          localStorage.setItem("cashtrack_savings_goals", JSON.stringify(activeGoalsRemaining));
          localStorage.setItem("cashtrack_completed_goals", JSON.stringify(completedGoalsList));
          localStorage.setItem("cashtrack_savings_history", JSON.stringify(savingsHistory));

          // Sync primary single goal backward-compatible key
          if (activeGoalsRemaining.length > 0) {
            const sorted = [...activeGoalsRemaining].sort((a, b) => a.priority - b.priority);
            localStorage.setItem("cashtrack_savings_goal", JSON.stringify(sorted[0]));
          } else {
            localStorage.removeItem("cashtrack_savings_goal");
          }

          // Play appropriate sound/visual events
          window.dispatchEvent(new Event("cashtrack_savings_goal_updated"));
          
          // Trigger companion messages for completing goals
          if (completedGoalsThisTurn.length > 0) {
            completedGoalsThisTurn.forEach((cg, index) => {
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent("cashtrack_companion_trigger", { 
                  detail: { 
                    type: "goal_complete", 
                    goalName: cg.name 
                  } 
                }));
              }, 500 * (index + 1));
            });
          } else {
            // Play savings progress animation on companion (wave & show progression message)
            window.dispatchEvent(new CustomEvent("cashtrack_companion_trigger", { detail: { type: "under_budget" } }));
          }
        }

        setAmount("");
        setCategory("");
        setNote("");
        setDate(new Date().toISOString().split("T")[0]);
        onClose();
        window.dispatchEvent(new Event("cashtrack_expense_logged"));
        onSuccess(result.streak, result.milestoneReached, result.milestoneValue);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during sync");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with premium cinematic blur */}
          <motion.div
            id="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* Luxury Bottom Drawer Sheet */}
          <motion.div
            id="modal-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white dark:bg-[#202534] border-t border-[#ECECEC] dark:border-white/10 rounded-t-[32px] shadow-[0_-8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_24px_rgba(0,0,0,0.3)] z-50 overflow-hidden pb-8"
          >
            {/* Drawer soft handle indicator */}
            <div className="flex justify-center py-3.5">
              <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>

            {/* Header row */}
            <div className="flex justify-between items-center px-6 pb-4 border-b border-[#ECECEC]/60 dark:border-white/10">
              <div>
                <h2 className="text-sm font-black text-[#111111] dark:text-[#FFFFFF] tracking-tight">Log Cash Outlay</h2>
                <p className="text-[10px] text-[#707070] dark:text-[#C6CBD8] font-medium">Record and self-reflect on your spending</p>
              </div>
              <button
                id="close-modal-btn"
                onClick={onClose}
                className="p-2 rounded-full bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 text-[#707070] dark:text-[#C6CBD8] hover:text-[#111111] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1D212D] transition-colors cursor-pointer active:scale-90"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh] no-scrollbar">
              {error && (
                <div className="p-3 rounded-[14px] bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center animate-shake">
                  {error}
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider">Amount Spent (INR)</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-[#707070] dark:text-[#8B93A7] text-2xl font-black font-mono">₹</div>
                  <input
                    id="amount-input"
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    required
                    className="w-full bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[20px] py-4 pl-10 pr-4 text-3xl font-black text-[#111111] dark:text-[#FFFFFF] focus:outline-none focus:border-[#FF5CA8] transition-colors placeholder-gray-300 dark:placeholder-gray-600 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                  />
                </div>
              </div>

              {/* Category selector grouped by 70/20/10 pools */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider">Allocation Sector</label>
                  <span className="text-[9px] font-bold text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider">70/20/10 Framework</span>
                </div>
                
                <div className="space-y-4">
                  {/* Needs */}
                  <div className="space-y-1.5">
                    <h3 className="text-[9px] font-black uppercase text-[#22C55E] tracking-wider">Needs Pool (70%)</h3>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.filter(c => c.bucket === "Needs").map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setCategory(cat.name)}
                          className={`px-4 py-2.5 rounded-[14px] text-xs font-bold border transition-colors duration-150 cursor-pointer outline-none ${
                            category === cat.name
                              ? "bg-[#22C55E] text-white border-[#22C55E] shadow-sm scale-[1.03]"
                              : "bg-[#F8F8FA] dark:bg-[#171A23] border-[#ECECEC] dark:border-white/10 text-[#707070] dark:text-[#C6CBD8] hover:border-[#22C55E]/40"
                          }`}
                        >
                          {cat.name.replace("Food ??", "")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wants */}
                  <div className="space-y-1.5">
                    <h3 className="text-[9px] font-black uppercase text-[#FF5CA8] tracking-wider">Wants Pool (20%)</h3>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.filter(c => c.bucket === "Wants").map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setCategory(cat.name)}
                          className={`px-4 py-2.5 rounded-[14px] text-xs font-bold border transition-colors duration-150 cursor-pointer outline-none ${
                            category === cat.name
                              ? "bg-[#FF5CA8] text-white border-[#FF5CA8] shadow-sm scale-[1.03]"
                              : "bg-[#F8F8FA] dark:bg-[#171A23] border-[#ECECEC] dark:border-white/10 text-[#707070] dark:text-[#C6CBD8] hover:border-[#FF5CA8]/40"
                          }`}
                        >
                          {cat.name.replace("Food ??", "")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Savings */}
                  <div className="space-y-1.5">
                    <h3 className="text-[9px] font-black uppercase text-[#8B5CF6] tracking-wider">Savings Pool (10%)</h3>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.filter(c => c.bucket === "Savings").map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setCategory(cat.name)}
                          className={`px-4 py-2.5 rounded-[14px] text-xs font-bold border transition-colors duration-150 cursor-pointer outline-none ${
                            category === cat.name
                              ? "bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm scale-[1.03]"
                              : "bg-[#F8F8FA] dark:bg-[#171A23] border-[#ECECEC] dark:border-white/10 text-[#707070] dark:text-[#C6CBD8] hover:border-[#8B5CF6]/40"
                          }`}
                        >
                          {cat.name.split("/")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Intelligent Allocation Panel for Savings */}
              {category === "Savings/Investment" && (
                <div className="p-4 bg-[#F8F8FA] dark:bg-[#171A23] rounded-[24px] border border-[#ECECEC] dark:border-white/10 space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center pb-2 border-b border-[#ECECEC]/50 dark:border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#8B5CF6] dark:text-purple-400 flex items-center gap-1">
                      🎯 Savings Goal Allocation
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={syncToGoals}
                        onChange={(e) => setSyncToGoals(e.target.checked)}
                        className="rounded border-gray-300 text-[#8B5CF6] focus:ring-[#8B5CF6] h-3.5 w-3.5"
                      />
                      <span className="text-[10px] font-bold text-[#707070] dark:text-[#C6CBD8] uppercase">Sync to Goals</span>
                    </label>
                  </div>

                  {/* Scenario 1: No active goals */}
                  {activeGoals.length === 0 && (
                    <div className="text-center py-4 space-y-3">
                      <p className="text-[11px] text-[#707070] dark:text-[#C6CBD8] font-medium leading-relaxed">
                        No active savings goals found. Create a goal inside the Hub to start depositing.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          window.dispatchEvent(new CustomEvent("cashtrack_open_savings_hub", { detail: { createOpen: true } }));
                        }}
                        className="bg-[#8B5CF6] hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        + Create Goal
                      </button>
                    </div>
                  )}

                  {/* Scenario 2: Exactly 1 active goal */}
                  {activeGoals.length === 1 && (() => {
                    const goal = activeGoals[0];
                    const pct = Math.round((goal.current / goal.target) * 100);
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{goal.image}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black text-[#111111] dark:text-[#FFFFFF] truncate">{goal.name}</h4>
                            <div className="flex justify-between text-[9px] text-[#707070] dark:text-[#C6CBD8] font-bold mt-0.5">
                              <span>₹{goal.current.toLocaleString("en-IN")} / ₹{goal.target.toLocaleString("en-IN")}</span>
                              <span className="text-[#8B5CF6] dark:text-purple-400">{pct}% Saved</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#8B5CF6] h-full rounded-full transition-colors duration-300" style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <div className="text-[9px] text-emerald-600 dark:text-emerald-300 font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 p-2 rounded-lg text-center">
                          ₹ Deposit will go to this Goal
                        </div>
                      </div>
                    );
                  })()}

                  {/* Scenario 3: Multiple active goals */}
                  {activeGoals.length > 1 && (
                    <div className="space-y-4">
                      {/* Split deposit toggle */}
                      <div className="flex justify-between items-center bg-white dark:bg-[#1D212D] p-2.5 rounded-[16px] border border-[#ECECEC] dark:border-white/10">
                        <span className="text-[10px] font-bold text-[#707070] dark:text-[#C6CBD8] uppercase">Split across goals?</span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextSplit = !splitMode;
                            setSplitMode(nextSplit);
                            if (!nextSplit) {
                              setSelectedGoalId(activeGoals[0].id);
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-colors border ${
                            splitMode
                              ? "bg-[#8B5CF6] text-white border-[#8B5CF6]"
                              : "bg-[#F8F8FA] dark:bg-[#171A23] border-[#ECECEC] dark:border-white/10 text-[#707070] dark:text-[#C6CBD8]"
                          }`}
                        >
                          {splitMode ? "Split Mode On" : "Single Goal"}
                        </button>
                      </div>

                      {/* Split Mode is OFF: Radio selector */}
                      {!splitMode && (
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider block">Select Recipient Goal</span>
                          <div className="space-y-2 max-h-44 overflow-y-auto no-scrollbar">
                            {activeGoals.map(g => (
                              <label
                                key={g.id}
                                className={`flex items-center gap-3 p-2.5 rounded-[16px] border cursor-pointer transition-colors ${
                                  selectedGoalId === g.id
                                    ? "bg-white dark:bg-[#1D212D] border-[#8B5CF6] shadow-sm"
                                    : "bg-white/40 dark:bg-white/5 border-[#ECECEC] dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="recipient_goal"
                                  checked={selectedGoalId === g.id}
                                  onChange={() => setSelectedGoalId(g.id)}
                                  className="text-[#8B5CF6] focus:ring-[#8B5CF6]"
                                />
                                <span className="text-xl">{g.image}</span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-[11px] font-black text-[#111111] dark:text-[#FFFFFF] truncate">{g.name}</h4>
                                  <p className="text-[9px] text-[#707070] dark:text-[#C6CBD8] font-bold">
                                    ₹{g.current.toLocaleString("en-IN")} / ₹{g.target.toLocaleString("en-IN")} ({Math.round((g.current / g.target) * 100)}%)
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Split Mode is ON: Split Allocation UI */}
                      {splitMode && (
                        <div className="space-y-3">
                          {/* Auto-split helper buttons */}
                          <div className="flex items-center justify-between gap-2 bg-white dark:bg-[#1D212D] p-2 rounded-[16px] border border-[#ECECEC] dark:border-white/10">
                            <span className="text-[9px] font-black text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider">Auto-Split Method:</span>
                            <div className="flex gap-1.5">
                              {(["equal", "priority", "smallest"] as const).map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    setAutoSplitType(type);
                                    const totalVal = parseFloat(amount) || 0;
                                    const allocs = runAutoAllocation(type, totalVal, activeGoals);
                                    setAllocations(allocs);
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider border transition-colors ${
                                    autoSplitType === type
                                      ? "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30"
                                      : "bg-gray-50 dark:bg-[#171A23] border-[#ECECEC] dark:border-white/10 text-[#707070] dark:text-[#C6CBD8] hover:bg-gray-100 dark:hover:bg-white/10"
                                  }`}
                                >
                                  {type === "equal" && "Equal"}
                                  {type === "priority" && "Priority"}
                                  {type === "smallest" && "Smallest"}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Goal allocation inputs list */}
                          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                            {activeGoals.map(g => {
                              const allocated = allocations[g.id] || 0;
                              const currentGap = g.target - g.current;
                              return (
                                <div key={g.id} className="flex items-center justify-between bg-white dark:bg-[#1D212D] p-2.5 rounded-[16px] border border-[#ECECEC] dark:border-white/10 gap-3">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="text-lg flex-shrink-0">{g.image}</span>
                                    <div className="min-w-0">
                                      <h4 className="text-[10px] font-black text-[#111111] dark:text-[#FFFFFF] truncate">{g.name}</h4>
                                      <p className="text-[8px] text-[#707070] dark:text-[#C6CBD8] font-bold">Left: ₹{currentGap.toLocaleString("en-IN")}</p>
                                    </div>
                                  </div>
                                  <div className="relative flex items-center w-24">
                                    <span className="absolute left-2.5 text-[9px] font-black text-[#707070] dark:text-[#8B93A7] font-mono">₹</span>
                                    <input
                                      type="number"
                                      step="any"
                                      value={allocated || ""}
                                      onChange={(e) => {
                                        setAutoSplitType("" as any);
                                        const val = parseFloat(e.target.value) || 0;
                                        setAllocations(prev => ({ ...prev, [g.id]: val }));
                                      }}
                                      placeholder="0.00"
                                      className="w-full bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-xl py-1.5 pl-5 pr-2 text-xs font-mono font-bold text-right text-[#111111] dark:text-[#FFFFFF] focus:outline-none focus:border-[#8B5CF6]"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Allocation Summary & Verification */}
                          {(() => {
                            const totalAmt = parseFloat(amount) || 0;
                            const totalAllocated = Object.values(allocations).reduce((s: number, v: number) => s + v, 0) as number;
                            const diff = Math.abs(totalAmt - totalAllocated);
                            const isMatched = diff < 0.05;

                            return (
                              <div className={`p-2.5 rounded-[16px] border text-center text-[10px] font-bold flex justify-between items-center ${
                                isMatched
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-300"
                                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-800/40 text-amber-600 dark:text-amber-300 animate-pulse"
                              }`}>
                                <span>Allocated: ₹{(totalAllocated as any).toLocaleString("en-IN")} / ₹{(totalAmt as any).toLocaleString("en-IN")}</span>
                                <span>{isMatched ? "✅ Balanced" : `⚠️ Unbalanced (diff: ₹${diff.toFixed(2)})`}</span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Optional Memo note */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={12} />
                  Add Note <span className="text-[#707070]/50 dark:text-[#8B93A7]/50 lowercase font-medium italic">(optional)</span>
                </label>
                <input
                  id="note-input"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Tiffin, tea split, train ticket..."
                  className="w-full bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[16px] py-3.5 px-4 text-xs font-bold text-[#111111] dark:text-[#FFFFFF] focus:outline-none focus:border-[#FF5CA8] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Expense Date input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={12} />
                  Outlay Date
                </label>
                <input
                  id="date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[16px] py-3.5 px-4 text-xs font-bold text-[#111111] dark:text-[#FFFFFF] focus:outline-none focus:border-[#FF5CA8] transition-colors font-mono"
                />
              </div>

              {/* Optional Receipt scanner simulator */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider flex items-center gap-1.5">
                  <Camera size={12} />
                  Receipt Scanner / Photo <span className="text-[#707070]/50 dark:text-[#8B93A7]/50 lowercase font-medium italic">(optional)</span>
                </label>
                {receiptAttached ? (
                  <div className="flex items-center justify-between bg-[#22C55E]/5 border border-[#22C55E]/15 p-3.5 rounded-[16px] text-[#22C55E] text-xs font-black animate-fadeIn">
                    <span className="flex items-center gap-2">📎 Attached: {receiptAttached}</span>
                    <button type="button" onClick={() => setReceiptAttached("")} className="text-gray-400 hover:text-[#EF4444] transition-colors cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReceiptAttached("receipt_" + Math.random().toString(36).substring(2, 6) + ".jpg")}
                    className="w-full bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 hover:border-[#FF5CA8]/30 py-3.5 rounded-[16px] text-xs font-bold text-[#707070] dark:text-[#C6CBD8] hover:text-[#111111] dark:hover:text-white transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer outline-none"
                  >
                    <Camera size={13} className="text-[#707070] dark:text-[#8B93A7]" /> Simulate Receipt Scan
                  </button>
                )}
              </div>

              {/* Submitting Actions */}
              <button
                id="save-expense-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF5CA8] hover:bg-[#ff3c96] text-white font-black py-4 rounded-[18px] transition-colors duration-150 cursor-pointer shadow-lg shadow-[#FF5CA8]/15 active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2 mt-4 outline-none"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Record Cash Transaction"
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
