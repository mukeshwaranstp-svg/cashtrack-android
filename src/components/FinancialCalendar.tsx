import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  DollarSign, 
  Sparkles, 
  Clock, 
  Tag, 
  AlertCircle, 
  Check, 
  MapPin,
  Flame,
  Info
} from "lucide-react";
import { Expense, SummaryData } from "../types";
import { CATEGORIES, getBucketForCategory } from "../constants/categories";
import { getCategoryIcon } from "./Dashboard";
import PageLayout from "./PageLayout";

interface FinancialCalendarProps {
  onClose: () => void;
  data: SummaryData | null;
  onRefresh: () => void;
  onOpenAddExpense: () => void;
}

interface LocalGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  image: string;
  completed: boolean;
  notes?: string;
  status?: string;
}

export function FinancialCalendar({ onClose, data, onRefresh, onOpenAddExpense }: FinancialCalendarProps) {
  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  // Current visible month/year
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed
  
  // Animation direction for month change slide
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");

  // Selected date (formatted YYYY-MM-DD)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Search and Filter States for daily transactions
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | "Needs" | "Wants" | "Savings" | "Completed" | "Large">("All");

  // Active view states
  const [selectedTx, setSelectedTx] = useState<Expense | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  
  // In-page Quick Add form overlay
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Edit Form Fields
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editGoalId, setEditGoalId] = useState("");
  const [editError, setEditError] = useState("");

  // Quick Add Fields
  const [addAmount, setAddAmount] = useState("");
  const [addCategory, setAddCategory] = useState("Food");
  const [addNote, setAddNote] = useState("");
  const [addGoalId, setAddGoalId] = useState("");
  const [addError, setAddError] = useState("");

  // Load all transactions from backend
  const [allTransactions, setAllTransactions] = useState<Expense[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);

  const fetchAllTxs = async () => {
    setLoadingTxs(true);
    let attempts = 0;
    const maxAttempts = 5;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    while (attempts < maxAttempts) {
      try {
        const res = await fetch("/api/expenses");
        if (res.ok) {
          const json = await res.json();
          setAllTransactions(json);
          setLoadingTxs(false);
          return;
        } else {
          console.warn(`Fetch expenses returned status ${res.status}. Retrying...`);
        }
      } catch (e) {
        console.error(`Attempt ${attempts + 1} to load historical transactions failed:`, e);
      }
      attempts++;
      if (attempts < maxAttempts) {
        await delay(500 * attempts);
      }
    }
    setLoadingTxs(false);
  };

  useEffect(() => {
    fetchAllTxs();
  }, [data]);

  // Read savings goals list from localStorage
  const [localGoals, setLocalGoals] = useState<LocalGoal[]>(() => {
    try {
      const active = JSON.parse(localStorage.getItem("cashtrack_savings_goals") || "[]");
      const completed = JSON.parse(localStorage.getItem("cashtrack_completed_goals") || "[]");
      return [...active, ...completed];
    } catch (e) {
      return [];
    }
  });

  const reloadLocalGoals = () => {
    try {
      const active = JSON.parse(localStorage.getItem("cashtrack_savings_goals") || "[]");
      const completed = JSON.parse(localStorage.getItem("cashtrack_completed_goals") || "[]");
      setLocalGoals([...active, ...completed]);
    } catch (e) {}
  };

  // 1. Core Month Navigation
  const handlePrevMonth = () => {
    setSlideDirection("left");
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setSlideDirection("right");
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Helper arrays for calendar rendering
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const startDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  // Group all transactions by date
  const txGroupedByDate = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    allTransactions.forEach(tx => {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    });
    return groups;
  }, [allTransactions]);

  // Monthly Overview calculation based on currently viewed month/year
  const monthlyStats = useMemo(() => {
    const yearMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const monthlyTxs = allTransactions.filter(tx => tx.date.startsWith(yearMonthStr));
    
    let totalExpenses = 0;
    let totalSavings = 0;
    let needsSpending = 0;
    let wantsSpending = 0;
    
    const dailySpendMap: Record<string, number> = {};
    const dailySavedMap: Record<string, number> = {};
    
    monthlyTxs.forEach(tx => {
      if (tx.bucket === "Savings") {
        totalSavings += tx.amount;
        dailySavedMap[tx.date] = (dailySavedMap[tx.date] || 0) + tx.amount;
      } else {
        totalExpenses += tx.amount;
        dailySpendMap[tx.date] = (dailySpendMap[tx.date] || 0) + tx.amount;
        
        if (tx.bucket === "Needs") {
          needsSpending += tx.amount;
        } else if (tx.bucket === "Wants") {
          wantsSpending += tx.amount;
        }
      }
    });

    let mostExpensiveDay = "None";
    let maxSpend = 0;
    Object.entries(dailySpendMap).forEach(([date, amt]) => {
      if (amt > maxSpend) {
        maxSpend = amt;
        mostExpensiveDay = date;
      }
    });

    let highestSavingDay = "None";
    let maxSave = 0;
    Object.entries(dailySavedMap).forEach(([date, amt]) => {
      if (amt > maxSave) {
        maxSave = amt;
        highestSavingDay = date;
      }
    });

    return {
      totalExpenses,
      totalSavings,
      needsSpending,
      wantsSpending,
      mostExpensiveDay: mostExpensiveDay !== "None" ? `${new Date(mostExpensiveDay).getDate()} ${monthNames[currentMonth].substring(0, 3)}` : "None",
      maxSpend,
      highestSavingDay: highestSavingDay !== "None" ? `${new Date(highestSavingDay).getDate()} ${monthNames[currentMonth].substring(0, 3)}` : "None",
      maxSave,
      totalTransactions: monthlyTxs.length
    };
  }, [allTransactions, currentYear, currentMonth]);

  // Selected date transactions
  const selectedDateTxs = useMemo(() => {
    return txGroupedByDate[selectedDateStr] || [];
  }, [txGroupedByDate, selectedDateStr]);

  // Filtered and searched transactions list for the selected day
  const filteredSelectedDateTxs = useMemo(() => {
    let txs = [...selectedDateTxs];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      txs = txs.filter(tx => {
        return (
          tx.category.toLowerCase().includes(q) ||
          tx.note.toLowerCase().includes(q) ||
          tx.amount.toString().includes(q) ||
          (tx.goalName && tx.goalName.toLowerCase().includes(q))
        );
      });
    }

    // Quick Filters
    if (activeFilter === "Needs") {
      txs = txs.filter(tx => tx.bucket === "Needs");
    } else if (activeFilter === "Wants") {
      txs = txs.filter(tx => tx.bucket === "Wants");
    } else if (activeFilter === "Savings") {
      txs = txs.filter(tx => tx.bucket === "Savings");
    } else if (activeFilter === "Completed") {
      // Find transactions linked to completed goals
      txs = txs.filter(tx => {
        if (!tx.goalId) return false;
        const g = localGoals.find(g => g.id === tx.goalId);
        return g ? g.completed : false;
      });
    } else if (activeFilter === "Large") {
      // Transactions >= ??000
      txs = txs.filter(tx => tx.amount >= 1000);
    }

    return txs;
  }, [selectedDateTxs, searchQuery, activeFilter, localGoals]);

  // Daily stats breakdown
  const dailySummary = useMemo(() => {
    let spent = 0;
    let saved = 0;
    let needs = 0;
    let wants = 0;
    let savings = 0;

    selectedDateTxs.forEach(tx => {
      if (tx.bucket === "Savings") {
        saved += tx.amount;
        savings += tx.amount;
      } else {
        spent += tx.amount;
        if (tx.bucket === "Needs") needs += tx.amount;
        if (tx.bucket === "Wants") wants += tx.amount;
      }
    });

    return {
      spent,
      saved,
      needs,
      wants,
      savings,
      count: selectedDateTxs.length
    };
  }, [selectedDateTxs]);

  // Setup Edit Form when selecting a transaction for editing
  const enterEditMode = (tx: Expense) => {
    setEditAmount(tx.amount.toString());
    setEditCategory(tx.category);
    setEditNote(tx.note);
    setEditDate(tx.date);
    
    // Parse time
    let timeStr = "12:00";
    try {
      const dt = new Date(tx.timestamp);
      const hrs = String(dt.getHours()).padStart(2, "0");
      const mins = String(dt.getMinutes()).padStart(2, "0");
      timeStr = `${hrs}:${mins}`;
    } catch(err){}
    setEditTime(timeStr);
    
    setEditGoalId(tx.goalId || "");
    setEditError("");
    setIsEditing(true);
  };

  // Sync / Adjust Local Storage Savings Goals progress after transaction modification (edit / delete / duplicate)
  const adjustSavingsGoalProgress = (
    goalId: string, 
    diffAmt: number, 
    goalAllocations?: Record<string, number>
  ) => {
    if (!goalId && !goalAllocations) return;

    // Load goals from local storage
    const activeGoalsRaw = localStorage.getItem("cashtrack_savings_goals") || "[]";
    const completedGoalsRaw = localStorage.getItem("cashtrack_completed_goals") || "[]";
    
    let activeList: LocalGoal[] = [];
    let completedList: LocalGoal[] = [];
    
    try { activeList = JSON.parse(activeGoalsRaw); } catch(e){}
    try { completedList = JSON.parse(completedGoalsRaw); } catch(e){}

    // Create a unified list of goals to process
    let allGoals = [...activeList, ...completedList];

    // Build the set of adjustments
    const adjustments: Record<string, number> = {};
    if (goalAllocations && Object.keys(goalAllocations).length > 0) {
      Object.entries(goalAllocations).forEach(([gid, amt]) => {
        adjustments[gid] = amt; // This represents original allocation or custom allocation
      });
    } else if (goalId) {
      adjustments[goalId] = diffAmt;
    }

    // Apply adjustments
    allGoals = allGoals.map(g => {
      const adj = adjustments[g.id];
      if (adj !== undefined) {
        // diffAmt can be negative (deletion) or positive (addition / delta)
        const amtChange = goalAllocations ? diffAmt : adj; // if allocations supplied, diffAmt is multiplier or total delta
        const newCurrent = Math.max(0, Math.min(g.current + amtChange, g.target));
        const isCompleted = newCurrent >= g.target;
        
        return {
          ...g,
          current: newCurrent,
          completed: isCompleted,
          status: isCompleted ? "Ready to Complete" : (newCurrent / g.target >= 0.8 ? "Almost Complete" : g.status)
        } as LocalGoal;
      }
      return g;
    });

    // Re-split into active and completed
    const newActive = allGoals.filter(g => !g.completed);
    const newCompleted = allGoals.filter(g => g.completed);

    localStorage.setItem("cashtrack_savings_goals", JSON.stringify(newActive));
    localStorage.setItem("cashtrack_completed_goals", JSON.stringify(newCompleted));
    
    reloadLocalGoals();
  };

  // Edit Transaction Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");

    if (!selectedTx) return;
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) {
      setEditError("Please enter a valid amount");
      return;
    }
    if (!editCategory) {
      setEditError("Please select a category");
      return;
    }

    try {
      const fullTimestamp = new Date(`${editDate}T${editTime}:00`).toISOString();
      const updatedBucket = getBucketForCategory(editCategory);

      // Determine the goal information if any
      let finalGoalId = "";
      let finalGoalName = "";
      let finalGoalImage = "";
      
      if (updatedBucket === "Savings" && editGoalId) {
        const foundGoal = localGoals.find(g => g.id === editGoalId);
        if (foundGoal) {
          finalGoalId = foundGoal.id;
          finalGoalName = foundGoal.name;
          finalGoalImage = foundGoal.image;
        }
      }

      // API request to update the transaction on the backend
      const res = await fetch(`/api/expense/${selectedTx.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          category: editCategory,
          note: editNote,
          date: editDate,
          timestamp: fullTimestamp,
          goalId: finalGoalId || undefined,
          goalName: finalGoalName || undefined,
          goalImage: finalGoalImage || undefined,
        })
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          // Adjust local storage savings goal progress!
          // 1. Revert original goal progress
          if (selectedTx.bucket === "Savings" && selectedTx.goalId) {
            adjustSavingsGoalProgress(selectedTx.goalId, -selectedTx.amount);
          }
          // 2. Apply new goal progress
          if (updatedBucket === "Savings" && finalGoalId) {
            adjustSavingsGoalProgress(finalGoalId, amt);
          }

          // Trigger rewards updates and companions (e.g. XP & Coins)
          const currentXp = parseInt(localStorage.getItem("cashtrack_xp") || "350", 10);
          localStorage.setItem("cashtrack_xp", String(currentXp + 15)); // 15 XP for editing/tidying ledger

          setIsEditing(false);
          setSelectedTx(null);
          
          // Refresh views
          onRefresh();
          fetchAllTxs();
        } else {
          setEditError("Failed to update transaction");
        }
      } else {
        setEditError("Failed to connect to ledger server");
      }
    } catch (err) {
      setEditError("An unexpected error occurred");
    }
  };

  // Duplicate Transaction Handler
  const handleDuplicate = async (tx: Expense) => {
    try {
      // Reward Coins & XP for duplicate/additional logs
      const currentXp = parseInt(localStorage.getItem("cashtrack_xp") || "350", 10);
      const currentCoins = parseInt(localStorage.getItem("cashtrack_coins") || "120", 10);
      localStorage.setItem("cashtrack_xp", String(currentXp + 30)); // 30 XP for quick duplicate
      localStorage.setItem("cashtrack_coins", String(currentCoins + 10)); // 10 Coins

      const res = await fetch("/api/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: tx.amount,
          category: tx.category,
          note: `${tx.note} (Copy)`,
          date: selectedDateStr, // Use selected calendar date
          timestamp: new Date(`${selectedDateStr}T12:00:00`).toISOString(),
          goalId: tx.goalId,
          goalName: tx.goalName,
          goalImage: tx.goalImage,
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          // If savings goal, add additional progress
          if (tx.bucket === "Savings" && tx.goalId) {
            adjustSavingsGoalProgress(tx.goalId, tx.amount);
          }
          setSelectedTx(null);
          onRefresh();
          fetchAllTxs();
        }
      }
    } catch (e) {
      console.error("Failed to duplicate transaction", e);
    }
  };

  // Delete Transaction Handler
  const handleDelete = async (tx: Expense) => {
    try {
      const res = await fetch(`/api/expense/${tx.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          // If transaction belonged to a savings goal, decrement savings goal progress
          if (tx.bucket === "Savings" && tx.goalId) {
            adjustSavingsGoalProgress(tx.goalId, -tx.amount);
          }

          setIsDeletingId(null);
          setSelectedTx(null);
          onRefresh();
          fetchAllTxs();
        }
      }
    } catch (e) {
      console.error("Failed to delete transaction", e);
    }
  };

  // Quick Add Transaction Form Submit
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");

    const amt = parseFloat(addAmount);
    if (isNaN(amt) || amt <= 0) {
      setAddError("Please enter a valid amount");
      return;
    }

    try {
      const bucket = getBucketForCategory(addCategory);
      let goalId = "";
      let goalName = "";
      let goalImage = "";

      if (bucket === "Savings" && addGoalId) {
        const foundGoal = localGoals.find(g => g.id === addGoalId);
        if (foundGoal) {
          goalId = foundGoal.id;
          goalName = foundGoal.name;
          goalImage = foundGoal.image;
        }
      }

      const res = await fetch("/api/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          category: addCategory,
          note: addNote,
          date: selectedDateStr,
          timestamp: new Date(`${selectedDateStr}T12:00:00`).toISOString(),
          goalId: goalId || undefined,
          goalName: goalName || undefined,
          goalImage: goalImage || undefined
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          // If savings goal, add progress
          if (bucket === "Savings" && goalId) {
            adjustSavingsGoalProgress(goalId, amt);
          }

          // Reward Coins & XP
          const currentXp = parseInt(localStorage.getItem("cashtrack_xp") || "350", 10);
          const currentCoins = parseInt(localStorage.getItem("cashtrack_coins") || "120", 10);
          localStorage.setItem("cashtrack_xp", String(currentXp + 50));
          localStorage.setItem("cashtrack_coins", String(currentCoins + 25));

          setAddAmount("");
          setAddNote("");
          setAddGoalId("");
          setIsQuickAddOpen(false);
          onRefresh();
          fetchAllTxs();
        }
      }
    } catch (err) {
      setAddError("Could not add transaction");
    }
  };

  // Date cell renderer computation
  const daysArray = useMemo(() => {
    const arr = [];
    // Padding days for starting offset
    for (let i = 0; i < startDayOfWeek; i++) {
      arr.push(null);
    }
    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push(i);
    }
    return arr;
  }, [daysInMonth, startDayOfWeek]);

  return (
    <PageLayout className="space-y-6 animate-fadeIn">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-black text-[#707070] hover:text-[#111111] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} strokeWidth={2.5} /> Back to Tools
        </button>
        <span className="text-[10px] bg-purple-50 text-[#8B5CF6] border border-[#8B5CF6]/15 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={10} /> Sync Active
        </span>
      </div>

      {/* Main Feature Title */}
      <div className="space-y-1 py-2">
        <h1 className="text-xl font-black text-[#111111] dark:text-[#FFFFFF] tracking-tight">
          Financial Calendar
        </h1>
        <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold leading-relaxed">
          Track and manage your comprehensive expense and savings history by date.
        </p>
      </div>

      {/* 1. Monthly Overview Header Grid */}
      <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/10 rounded-[24px] p-5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.015)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#707070] dark:text-[#8B93A7]">
            Overview 📅 {monthNames[currentMonth]} {currentYear}
          </span>
          <span className="text-[10px] bg-[#FF5CA8]/10 text-[#FF5CA8] font-black px-2 py-0.5 rounded-full">
            {monthlyStats.totalTransactions} transactions
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#FF5CA8]/5 rounded-[20px] p-4 space-y-1">
            <span className="text-[10px] font-black text-[#FF5CA8] uppercase tracking-wider flex items-center gap-1">
              <TrendingDown size={11} /> Total Expenses
            </span>
            <div className="text-xl font-black text-[#111111] dark:text-[#FFFFFF]">
              ₹{monthlyStats.totalExpenses.toLocaleString("en-IN")}
            </div>
            <div className="text-[9px] font-semibold text-[#707070] dark:text-[#C6CBD8] flex justify-between">
              <span>Needs: ₹{monthlyStats.needsSpending}</span>
              <span>Wants: ₹{monthlyStats.wantsSpending}</span>
            </div>
          </div>

          <div className="bg-[#8B5CF6]/5 rounded-[20px] p-4 space-y-1">
            <span className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-wider flex items-center gap-1">
              <PiggyBank size={11} /> Total Savings
            </span>
            <div className="text-xl font-black text-[#111111] dark:text-[#FFFFFF]">
              ₹{monthlyStats.totalSavings.toLocaleString("en-IN")}
            </div>
            <div className="text-[9px] font-semibold text-[#707070] dark:text-[#C6CBD8]">
              Deposits to active goals
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#ECECEC]/40 dark:border-white/10 text-[10px] font-bold text-[#707070] dark:text-[#C6CBD8]">
          <div className="flex items-center justify-between pr-2">
            <span>Peak Spending Day:</span>
            <span className="text-[#111111] dark:text-[#FFFFFF] font-black">{monthlyStats.mostExpensiveDay} {monthlyStats.maxSpend > 0 ? `(₹${monthlyStats.maxSpend})` : ""}</span>
          </div>
          <div className="flex items-center justify-between pl-2 border-l border-[#ECECEC]/40 dark:border-white/10">
            <span>Peak Savings Day:</span>
            <span className="text-[#111111] dark:text-[#FFFFFF] font-black">{monthlyStats.highestSavingDay} {monthlyStats.maxSave > 0 ? `(₹${monthlyStats.maxSave})` : ""}</span>
          </div>
        </div>
      </div>

      {/* 2. Monthly Calendar Display Card */}
      <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/10 rounded-[28px] p-4.5 shadow-[0_6px_18px_rgba(0,0,0,0.015)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.4)] space-y-4">
        
        {/* Navigation Selector */}
        <div className="flex items-center justify-between px-1.5">
          <button 
            onClick={handlePrevMonth}
            className="w-9 h-9 rounded-full bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 flex items-center justify-center hover:bg-[#F0F0F2] dark:hover:bg-gray-800 active:scale-95 transition-colors cursor-pointer text-[#111111] dark:text-[#FFFFFF]"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[15px] font-black text-[#111111] dark:text-[#FFFFFF] tracking-tight">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <span className="text-[9px] font-bold text-[#707070] dark:text-[#8B93A7] tracking-wider uppercase">
              Monthly Calendar view
            </span>
          </div>

          <button 
            onClick={handleNextMonth}
            className="w-9 h-9 rounded-full bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 flex items-center justify-center hover:bg-[#F0F0F2] dark:hover:bg-gray-800 active:scale-95 transition-colors cursor-pointer text-[#111111] dark:text-[#FFFFFF]"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Weekday Labels Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-wider text-[#707070] dark:text-[#8B93A7] pb-1.5 border-b border-[#ECECEC]/40 dark:border-white/10">
          {weekdays.map(d => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* Days Grid with Animation */}
        <div className="relative overflow-hidden min-h-[250px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentYear}-${currentMonth}`}
              initial={{ x: slideDirection === "right" ? 50 : -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: slideDirection === "right" ? -50 : 50, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="grid grid-cols-7 gap-1"
            >
              {daysArray.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <div key={`empty-${idx}`} className="aspect-square bg-[#F8F8FA]/40 dark:bg-[#171A23]/40 rounded-[14px]" />;
                }

                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const isSelected = selectedDateStr === dateStr;
                const isToday = new Date().toISOString().split("T")[0] === dateStr;
                
                // Fetch transactions for this day
                const dayTxs = txGroupedByDate[dateStr] || [];
                
                // Indicators logic
                const hasNeeds = dayTxs.some(t => t.bucket === "Needs");
                const hasWants = dayTxs.some(t => t.bucket === "Wants");
                const hasSavings = dayTxs.some(t => t.bucket === "Savings");
                const hasMultiple = dayTxs.length > 1;

                return (
                  <motion.button
                    key={`day-${dayNum}`}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`aspect-square rounded-[16px] flex flex-col items-center justify-between py-2 relative transition-colors border outline-none cursor-pointer ${
                      isSelected 
                        ? "bg-[#111111] dark:bg-white border-[#111111] dark:border-white text-white dark:text-[#111111] shadow-lg shadow-black/10" 
                        : isToday
                          ? "bg-[#FF5CA8]/5 border-[#FF5CA8]/30 text-[#FF5CA8] font-black"
                          : "bg-white dark:bg-[#171A23] border-[#ECECEC] dark:border-white/10 hover:border-[#CCCCCC] dark:hover:border-gray-600 text-[#111111] dark:text-[#FFFFFF]"
                    }`}
                  >
                    <span className={`text-xs font-black`}>
                      {dayNum}
                    </span>

                    {/* Indicators underneath */}
                    <div className="flex justify-center items-center gap-0.5 h-1.5 w-full px-1">
                      {dayTxs.length > 0 && (
                        <>
                          {hasMultiple ? (
                            <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white dark:bg-[#111111]" : "bg-blue-500 animate-pulse"}`} title="Multiple Activities" />
                          ) : (
                            <>
                              {hasNeeds && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                              {hasWants && <div className="w-1 h-1 rounded-full bg-[#FF5CA8]" />}
                              {hasSavings && <div className="w-1 h-1 rounded-full bg-purple-500" />}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Daily Transactions Bottom sheet / Panel */}
      <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/10 rounded-[28px] overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
        
        {/* Dynamic header display of selected date */}
        <div className="bg-[#F8F8FA] dark:bg-[#171A23] px-5.5 py-4 border-b border-[#ECECEC] dark:border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-[#111111] dark:text-[#FFFFFF]">
              {(() => {
                const dateObj = new Date(selectedDateStr + "T00:00:00");
                return dateObj.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                });
              })()}
            </h3>
            <p className="text-[10px] font-bold text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider">
              Selected Day Activities
            </p>
          </div>
          
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="bg-[#111111] dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-[#111111] px-3.5 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1 transition-colors"
          >
            <Plus size={11} strokeWidth={3} /> Quick Add
          </button>
        </div>

        {/* Daily Summary statistics */}
        <div className="p-5 grid grid-cols-3 gap-2.5 bg-gray-50/50 dark:bg-[#171A23]/50 border-b border-[#ECECEC]/40 dark:border-white/10 text-center">
          <div className="space-y-0.5">
            <span className="text-[9px] font-black text-[#707070] dark:text-[#8B93A7] uppercase">Total Spent</span>
            <div className="text-[13px] font-black text-[#111111] dark:text-[#FFFFFF]">₹{dailySummary.spent}</div>
          </div>
          <div className="space-y-0.5 border-l border-[#ECECEC]/50 dark:border-white/10">
            <span className="text-[9px] font-black text-[#707070] dark:text-[#8B93A7] uppercase">Total Saved</span>
            <div className="text-[13px] font-black text-[#8B5CF6]">₹{dailySummary.saved}</div>
          </div>
          <div className="space-y-0.5 border-l border-[#ECECEC]/50 dark:border-white/10">
            <span className="text-[9px] font-black text-[#707070] dark:text-[#8B93A7] uppercase">Transactions</span>
            <div className="text-[13px] font-black text-[#FF5CA8]">{dailySummary.count} logged</div>
          </div>
        </div>

        {/* Filter and Search Bar for Daily List */}
        <div className="p-4.5 space-y-3">
          
          {/* Search box */}
          <div className="relative">
            <Search className="text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" size={13} />
            <input 
              type="text"
              placeholder="Search category, notes, goals, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-full pl-8.5 pr-4 py-2 text-xs font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-300 dark:focus:border-gray-600"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 outline-none"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick Filters Horizontal Scrolling Row */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {(["All", "Needs", "Wants", "Savings", "Completed", "Large"] as const).map(filter => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap cursor-pointer transition-colors ${
                    isActive 
                      ? "bg-[#FF5CA8] text-white shadow-sm shadow-[#FF5CA8]/15" 
                      : "bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 text-[#707070] dark:text-[#C6CBD8] hover:bg-[#F0F0F2] dark:hover:bg-gray-800"
                  }`}
                >
                  {filter === "Large" ? "₹1,000+ Large" : filter === "Completed" ? "Completed Goals" : filter}
                </button>
              );
            })}
          </div>

          {/* Transaction List with Animation */}
          <div className="space-y-2.5 pt-1">
            {filteredSelectedDateTxs.length > 0 ? (
              filteredSelectedDateTxs.map((tx, idx) => {
                const isSavings = tx.bucket === "Savings";
                const isNeeds = tx.bucket === "Needs";
                const isWants = tx.bucket === "Wants";

                // Time formatting helper
                let timeStr = "12:00 PM";
                try {
                  const dObj = new Date(tx.timestamp);
                  timeStr = dObj.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                  });
                } catch(e){}

                return (
                  <motion.button
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                    onClick={() => setSelectedTx(tx)}
                    className="w-full flex justify-between items-center p-3 border border-[#ECECEC]/70 dark:border-white/10 rounded-[18px] hover:bg-[#F8F8FA]/50 dark:hover:bg-white/5 transition-colors cursor-pointer text-left relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3.5">
                      {getCategoryIcon(tx.category)}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-[#111111] dark:text-[#FFFFFF]">
                            {tx.category}
                          </span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                            isNeeds 
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40" 
                              : isWants 
                                ? "bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-800/40" 
                                : "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/40"
                          }`}>
                            {tx.bucket}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] text-[#707070] dark:text-[#8B93A7] flex items-center gap-1 font-semibold">
                            <Clock size={10} /> {timeStr}
                          </span>
                          {tx.note && (
                            <span className="text-[10px] text-[#707070] dark:text-[#C6CBD8] font-bold line-clamp-1">
                              ₹{tx.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5 z-10">
                      <div className={`text-xs font-black ${isSavings ? "text-[#8B5CF6]" : "text-[#111111] dark:text-[#FFFFFF]"}`}>
                        {isSavings ? "+" : "-"} ₹{tx.amount.toLocaleString("en-IN")}
                      </div>
                      
                      {tx.goalName && (
                        <div className="text-[8px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/40 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                          <span>{tx.goalImage || "🎯"}</span>
                          <span className="max-w-[70px] truncate">{tx.goalName}</span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })
            ) : (
              /* Empty State */
              <div className="text-center py-10 space-y-3.5">
                <div className="w-12 h-12 bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-full flex items-center justify-center mx-auto text-[#707070] dark:text-[#8B93A7]">
                  <CalendarIcon size={18} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-[#111111] dark:text-[#FFFFFF]">No financial activity on this day.</p>
                  <p className="text-[10px] text-[#707070] dark:text-[#C6CBD8] font-semibold">You haven't logged any transactions yet on this calendar day.</p>
                </div>
                
                <button
                  onClick={() => setIsQuickAddOpen(true)}
                  className="bg-[#FF5CA8] hover:bg-[#ff3c96] text-white px-5 py-2 rounded-full text-xs font-black inline-flex items-center gap-1.5 transition-colors shadow-md shadow-[#FF5CA8]/10 cursor-pointer"
                >
                  <Plus size={13} strokeWidth={3} /> Add Transaction
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. TRANSACTION DETAILS DIALOG MODAL / BOTTOM SHEET */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center px-4 pb-4">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-white dark:bg-[#202534] border border-transparent dark:border-white/10 rounded-[28px] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col"
            >
              {/* Header */}
              <div className="p-5.5 border-b border-[#ECECEC] dark:border-white/10 flex items-center justify-between bg-[#F8F8FA] dark:bg-[#171A23]">
                <div>
                  <h3 className="text-xs font-black text-[#111111] dark:text-[#FFFFFF]">Transaction Ledger Detail</h3>
                  <p className="text-[9px] font-bold text-[#707070] dark:text-[#8B93A7] uppercase tracking-wider">Historical records verify</p>
                </div>
                <button 
                  onClick={() => { setSelectedTx(null); setIsEditing(false); }}
                  className="w-8 h-8 rounded-full bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Edit Form Toggle Container */}
              {!isEditing ? (
                /* Detail View */
                <div className="p-6 space-y-6 flex-1">
                  
                  {/* Category icon and main value header */}
                  <div className="flex flex-col items-center text-center space-y-2.5">
                    {getCategoryIcon(selectedTx.category)}
                    <div className="space-y-0.5">
                      <div className="text-2xl font-black text-[#111111] dark:text-[#FFFFFF]">
                        ₹{selectedTx.amount.toLocaleString("en-IN")}
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#707070] dark:text-[#8B93A7] uppercase">
                          {selectedTx.category}
                        </span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                          selectedTx.bucket === "Needs" 
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40" 
                            : selectedTx.bucket === "Wants" 
                              ? "bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-800/40" 
                              : "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/40"
                        }`}>
                          {selectedTx.bucket}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description Metadata Grid */}
                  <div className="bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[20px] p-4.5 space-y-3 text-xs">
                    <div className="flex justify-between border-b border-[#ECECEC]/50 dark:border-white/10 pb-2.5">
                      <span className="font-bold text-[#707070] dark:text-[#8B93A7]">Ledger ID</span>
                      <span className="font-mono text-[10px] text-[#111111] dark:text-[#FFFFFF] font-black uppercase">
                        {selectedTx.id}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-[#ECECEC]/50 dark:border-white/10 pb-2.5">
                      <span className="font-bold text-[#707070] dark:text-[#8B93A7]">Record Date</span>
                      <span className="text-[#111111] dark:text-[#FFFFFF] font-black">
                        {new Date(selectedTx.date + "T00:00:00").toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-[#ECECEC]/50 dark:border-white/10 pb-2.5">
                      <span className="font-bold text-[#707070] dark:text-[#8B93A7]">Logged Time</span>
                      <span className="text-[#111111] dark:text-[#FFFFFF] font-black">
                        {new Date(selectedTx.timestamp).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        })}
                      </span>
                    </div>

                    <div className="flex flex-col space-y-1 pt-1.5">
                      <span className="font-bold text-[#707070] dark:text-[#8B93A7]">Ledger Notes</span>
                      <span className="text-[#111111] dark:text-[#FFFFFF] font-semibold bg-white dark:bg-[#1D212D] p-2.5 rounded-[12px] border border-[#ECECEC] dark:border-white/10 italic text-[11px] min-h-[40px] block">
                        {selectedTx.note || "No custom annotation logged."}
                      </span>
                    </div>
                  </div>

                  {/* Linked Savings Goal details integration */}
                  {selectedTx.bucket === "Savings" && selectedTx.goalId && (
                    <div className="bg-purple-50/50 border border-purple-100 rounded-[20px] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                          Linked Goal Synchronization
                        </span>
                        <span className="text-[10px] font-bold text-[#707070]">
                          Savings Pool
                        </span>
                      </div>

                      {(() => {
                        const goal = localGoals.find(g => g.id === selectedTx.goalId);
                        if (!goal) {
                          return (
                            <div className="text-[10px] text-gray-400 italic">
                              Savings goal is archived or completed.
                            </div>
                          );
                        }

                        const progressPct = Math.round((goal.current / goal.target) * 100);
                        const leftAmt = Math.max(0, goal.target - goal.current);

                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{goal.image || "🎯"}</span>
                                <div className="leading-tight">
                                  <h4 className="text-xs font-black text-[#111111]">{goal.name}</h4>
                                  <p className="text-[9px] font-semibold text-[#707070]">
                                    Progress: {progressPct}%
                                  </p>
                                </div>
                              </div>
                              <div className="text-right leading-tight">
                                <div className="text-xs font-black text-[#111111]">
                                  ₹{goal.current.toLocaleString("en-IN")}
                                </div>
                                <p className="text-[9px] font-semibold text-[#707070]">
                                  of ₹{goal.target.toLocaleString("en-IN")}
                                </p>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-[#ECECEC] h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#8B5CF6] h-full rounded-full transition-colors duration-300" 
                                style={{ width: `${Math.min(100, progressPct)}%` }}
                              />
                            </div>

                            <div className="flex justify-between text-[9px] text-purple-600 font-bold pt-0.5">
                              <span>Saved on this log: ₹{selectedTx.amount}</span>
                              <span>Gap Remaining: ₹{leftAmt.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Confirmation dialog nested for deletion safety */}
                  {isDeletingId === selectedTx.id ? (
                    <div className="bg-red-50 border border-red-100 rounded-[20px] p-4 text-center space-y-3.5">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-red-600">Delete transaction record?</h4>
                        <p className="text-[10px] text-red-500 font-semibold leading-relaxed">
                          This operation cannot be undone. All linked savings goal progress, history logs, analytics, and companion metrics will decrease.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsDeletingId(null)}
                          className="flex-1 bg-white border border-[#ECECEC] hover:bg-gray-100 text-[#111111] text-[11px] py-2 rounded-full font-black cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(selectedTx)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-[11px] py-2 rounded-full font-black cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Primary Controls Footer */
                    <div className="flex gap-2.5 pt-2 border-t border-[#ECECEC]/50">
                      <button
                        onClick={() => enterEditMode(selectedTx)}
                        className="flex-1 bg-[#111111] hover:bg-black text-white py-3 rounded-full text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95 shadow-sm"
                      >
                        <Edit3 size={12} /> Edit Details
                      </button>

                      <button
                        onClick={() => handleDuplicate(selectedTx)}
                        className="bg-[#F8F8FA] border border-[#ECECEC] hover:bg-[#F0F0F2] text-[#111111] px-4 rounded-full text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95"
                        title="Duplicate record to selected day"
                      >
                        <Copy size={12} /> Duplicate
                      </button>

                      <button
                        onClick={() => setIsDeletingId(selectedTx.id)}
                        className="w-11 h-11 rounded-full bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center text-red-500 cursor-pointer transition-colors active:scale-95"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                /* Edit Form Screen */
                <form onSubmit={handleEditSubmit} className="p-5.5 space-y-4 flex-1">
                  
                  {editError && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-500 text-[10px] font-black rounded-lg flex items-center gap-1.5 animate-bounce">
                      <AlertCircle size={12} /> {editError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#707070]">Amount (₹)</label>
                    <input 
                      type="number"
                      step="any"
                      placeholder="e.g. 500"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full bg-[#F8F8FA] border border-[#ECECEC] rounded-[14px] px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#111111]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[#707070]">Category</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-[#F8F8FA] border border-[#ECECEC] rounded-[14px] px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#111111] cursor-pointer"
                        required
                      >
                        <option value="">Select Category</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat.name} value={cat.name}>
                            {cat.icon} {cat.name} ({cat.bucket})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[#707070]">Recipient Goal</label>
                      <select
                        value={editGoalId}
                        onChange={(e) => setEditGoalId(e.target.value)}
                        disabled={getBucketForCategory(editCategory) !== "Savings"}
                        className="w-full bg-[#F8F8FA] border border-[#ECECEC] rounded-[14px] px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#111111] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <option value="">No Linked Goal</option>
                        {localGoals.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.image} {g.name} (Goal: ₹{g.target})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[#707070]">Date</label>
                      <input 
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full bg-[#F8F8FA] border border-[#ECECEC] rounded-[14px] px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#111111]"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[#707070]">Time</label>
                      <input 
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="w-full bg-[#F8F8FA] border border-[#ECECEC] rounded-[14px] px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#111111]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#707070]">Notes / Annotation</label>
                    <textarea 
                      placeholder="Write brief description..."
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      rows={2}
                      className="w-full bg-[#F8F8FA] border border-[#ECECEC] rounded-[14px] px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-[#ECECEC]/40">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-[#F8F8FA] border border-[#ECECEC] hover:bg-[#F0F0F2] text-[#111111] py-3.5 rounded-full text-xs font-black cursor-pointer transition-colors active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#FF5CA8] hover:bg-[#ff3c96] text-white py-3.5 rounded-full text-xs font-black cursor-pointer transition-colors active:scale-95 shadow-md shadow-[#FF5CA8]/10"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. QUICK ADD NEW TRANSACTION OVERLAY IN-PAGE FORM */}
      <AnimatePresence>
        {isQuickAddOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center px-4 pb-4">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-white rounded-[28px] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-5.5 border-b border-[#ECECEC] flex items-center justify-between bg-[#F8F8FA]">
                <div>
                  <h3 className="text-xs font-black text-[#111111]">Quick Ledger Entry</h3>
                  <p className="text-[9px] font-bold text-[#707070] uppercase tracking-wider">
                    Add transaction on {new Date(selectedDateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <button 
                  onClick={() => setIsQuickAddOpen(false)}
                  className="w-8 h-8 rounded-full bg-white border border-[#ECECEC] flex items-center justify-center text-gray-500 hover:text-black cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleQuickAddSubmit} className="p-5.5 space-y-4">
                {addError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-500 text-[10px] font-black rounded-lg flex items-center gap-1.5 animate-bounce">
                    <AlertCircle size={12} /> {addError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#707070]">Amount (₹)</label>
                  <input 
                    type="number"
                    step="any"
                    placeholder="e.g. 500"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="w-full bg-[#F8F8FA] border border-[#ECECEC] rounded-[14px] px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#111111]"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#707070]">Category</label>
                    <select
                      value={addCategory}
                      onChange={(e) => setAddCategory(e.target.value)}
                      className="w-full bg-[#F8F8FA] border border-[#ECECEC] rounded-[14px] px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#111111] cursor-pointer"
                      required
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.name} value={cat.name}>
                          {cat.icon} {cat.name} ({cat.bucket})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#707070]">Recipient Goal</label>
                    <select
                      value={addGoalId}
                      onChange={(e) => setAddGoalId(e.target.value)}
                      disabled={getBucketForCategory(addCategory) !== "Savings"}
                      className="w-full bg-[#F8F8FA] border border-[#ECECEC] rounded-[14px] px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#111111] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <option value="">No Linked Goal</option>
                      {localGoals.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.image} {g.name} (Goal: ₹{g.target})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#707070]">Notes / Annotation</label>
                  <textarea 
                    placeholder="Describe transaction briefly..."
                    value={addNote}
                    onChange={(e) => setAddNote(e.target.value)}
                    rows={2}
                    className="w-full bg-[#F8F8FA] border border-[#ECECEC] rounded-[14px] px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#111111]"
                  />
                </div>

                <div className="flex gap-2 pt-3 border-t border-[#ECECEC]/40">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(false)}
                    className="flex-1 bg-[#F8F8FA] border border-[#ECECEC] hover:bg-[#F0F0F2] text-[#111111] py-3.5 rounded-full text-xs font-black cursor-pointer transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#FF5CA8] hover:bg-[#ff3c96] text-white py-3.5 rounded-full text-xs font-black cursor-pointer transition-colors active:scale-95 shadow-md shadow-[#FF5CA8]/10"
                  >
                    Add Transaction
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </PageLayout>
  );
}

export default React.memo(FinancialCalendar);
