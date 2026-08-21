import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import PageLayout from "./PageLayout";
import { 
  PiggyBank, 
  Calendar as CalendarIcon, 
  FileText, 
  Tag, 
  TrendingUp, 
  Target, 
  Download, 
  Bell, 
  Calculator, 
  Coins, 
  BookOpen, 
  Settings, 
  ChevronRight, 
  X, 
  ArrowRight,
  Plus,
  AlertTriangle,
  Sparkles,
  Check,
  Percent,
  Sliders,
  DollarSign,
  ListTodo,
  Trash2,
  Coffee
} from "lucide-react";
import { SummaryData, Expense } from "../types";
import { getCategoryIcon } from "./Dashboard";
import FinancialCalendar from "./FinancialCalendar";

interface ToolsProps {
  data: SummaryData | null;
  onRefresh: () => void;
  onOpenAddExpense: () => void;
  onNavigate: (tab: "home" | "analysis" | "profile") => void;
}

export function Tools({ data, onRefresh, onOpenAddExpense, onNavigate }: ToolsProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  // Local Settings and Alert Configurations
  const [currency, setCurrency] = useState(() => localStorage.getItem("cashtrack_currency") || "₹");
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("cashtrack_theme") || "Premium Light");
  const [alertThreshold, setAlertThreshold] = useState(() => localStorage.getItem("cashtrack_alert_threshold") || "1000");
  const [isAlertEnabled, setIsAlertEnabled] = useState(() => localStorage.getItem("cashtrack_alert_enabled") !== "false");
  
  // Interactive EMI Calculator State
  const [emiPrincipal, setEmiPrincipal] = useState(50000);
  const [emiRate, setEmiRate] = useState(12);
  const [emiTenure, setEmiTenure] = useState(12); // months

  // Interactive Currency Converter State
  const [convAmount, setConvAmount] = useState(100);
  const [convSource, setConvSource] = useState("USD");
  const [convTarget, setConvTarget] = useState("INR");

  // Normal Calculator State
  const [calcInput, setCalcInput] = useState("0");
  const [calcPrev, setCalcPrev] = useState<string | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcResetOnNext, setCalcResetOnNext] = useState(false);

  const handleCalcBtn = (val: string) => {
    if (val === "C") {
      setCalcInput("0");
      setCalcPrev(null);
      setCalcOp(null);
      setCalcResetOnNext(false);
      return;
    }
    
    if (val === "⌫" || val === "Back") {
      if (calcInput.length > 1) {
        setCalcInput(calcInput.slice(0, -1));
      } else {
        setCalcInput("0");
      }
      return;
    }

    if (["+", "-", "*", "/"].includes(val)) {
      setCalcPrev(calcInput);
      setCalcOp(val);
      setCalcResetOnNext(true);
      return;
    }

    if (val === "=") {
      if (calcPrev !== null && calcOp !== null) {
        const num1 = parseFloat(calcPrev);
        const num2 = parseFloat(calcInput);
        let result = 0;
        switch (calcOp) {
          case "+": result = num1 + num2; break;
          case "-": result = num1 - num2; break;
          case "*": result = num1 * num2; break;
          case "/": result = num2 !== 0 ? num1 / num2 : 0; break;
        }
        setCalcInput(String(Math.round(result * 10000) / 10000));
        setCalcPrev(null);
        setCalcOp(null);
        setCalcResetOnNext(true);
      }
      return;
    }

    if (val === ".") {
      if (calcResetOnNext) {
        setCalcInput("0.");
        setCalcResetOnNext(false);
      } else if (!calcInput.includes(".")) {
        setCalcInput(calcInput + ".");
      }
      return;
    }

    // Numbers
    if (calcInput === "0" || calcResetOnNext) {
      setCalcInput(val);
      setCalcResetOnNext(false);
    } else {
      setCalcInput(calcInput + val);
    }
  };

  // Financial Tips State
  const [tipIndex, setTipIndex] = useState(0);

  // Budget planner edit state
  const [tempBudget, setTempBudget] = useState(data ? String(data.monthlyBudget) : "15000");
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);



  // Todo List State
  const [todos, setTodos] = useState<{ id: string; text: string; completed: boolean; category: string }[]>(() => {
    const saved = localStorage.getItem("cashtrack_todos");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      { id: "1", text: "Set monthly budget limit", completed: false, category: "Budget" },
      { id: "2", text: "Review weekly food & drink spends", completed: false, category: "Audit" },
      { id: "3", text: "Save ₹1,000 this week", completed: false, category: "Savings" },
      { id: "4", text: "Cancel unused online subscriptions", completed: false, category: "Bills" }
    ];
  });
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoCategory, setNewTodoCategory] = useState("General");
  const [todoFilter, setTodoFilter] = useState<"all" | "pending" | "completed">("all");

  // Save todos to localStorage when they change
  useEffect(() => {
    localStorage.setItem("cashtrack_todos", JSON.stringify(todos));
  }, [todos]);

  // Activity Logs Persistence (simulation of system logs)
  const [lastExportTime, setLastExportTime] = useState(() => localStorage.getItem("cashtrack_last_export") || "Never exported yet");
  const [lastBudgetUpdated, setLastBudgetUpdated] = useState(() => localStorage.getItem("cashtrack_last_budget_update") || "Initial setup");

  // Synchronize state when data loads
  useEffect(() => {
    if (data) {
      setTempBudget(String(data.monthlyBudget));
    }
  }, [data]);



  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-[3.5px] border-[#ECECEC] border-t-[#FF5CA8] rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#707070] animate-pulse">Syncing premium tools...</p>
      </div>
    );
  }

  const { totalSpend, monthlyBudget, recentTransactions, bucketSummary, categorySummary } = data;

  if (selectedTool === "financial-calendar") {
    return (
      <FinancialCalendar 
        onClose={() => setSelectedTool(null)}
        data={data}
        onRefresh={onRefresh}
        onOpenAddExpense={onOpenAddExpense}
      />
    );
  }

  // 12 Tool configs
  const toolsList = [
    {
      id: "financial-calendar",
      title: "Financial Calendar",
      desc: "View your complete financial history by date.",
      icon: <CalendarIcon className="text-emerald-500" size={20} />,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      borderColor: "hover:border-emerald-500/20"
    },
    {
      id: "budget-planner",
      title: "Budget Planner",
      desc: "Manage monthly budget and spending limits.",
      icon: <PiggyBank className="text-[#FF5CA8]" size={20} />,
      gradient: "from-[#FF5CA8]/10 to-[#FF5CA8]/5",
      borderColor: "hover:border-[#FF5CA8]/20"
    },
    {
      id: "expense-reports",
      title: "Expense Reports",
      desc: "Weekly, monthly and yearly reports.",
      icon: <FileText className="text-blue-500" size={20} />,
      gradient: "from-blue-500/10 to-blue-500/5",
      borderColor: "hover:border-blue-500/20"
    },
    {
      id: "category-manager",
      title: "Category Manager",
      desc: "View spending allocations by category.",
      icon: <Tag className="text-emerald-500" size={20} />,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      borderColor: "hover:border-emerald-500/20"
    },
    {
      id: "spending-trends",
      title: "Spending Trends",
      desc: "Analyse visual metrics & health stats.",
      icon: <TrendingUp className="text-[#FF5CA8]" size={20} />,
      gradient: "from-[#FF5CA8]/10 to-[#FF5CA8]/5",
      borderColor: "hover:border-[#FF5CA8]/20"
    },

    {
      id: "export-data",
      title: "Export Data",
      desc: "Export ledger as clean format CSV file.",
      icon: <Download className="text-blue-500" size={20} />,
      gradient: "from-blue-500/10 to-blue-500/5",
      borderColor: "hover:border-blue-500/20"
    },
    {
      id: "spending-alerts",
      title: "Spending Alerts",
      desc: "Set thresholds and notify overruns.",
      icon: <Bell className="text-amber-500" size={20} />,
      gradient: "from-amber-500/10 to-amber-500/5",
      borderColor: "hover:border-amber-500/20"
    },
    {
      id: "emi-calculator",
      title: "EMI Calculator",
      desc: "Calculate loan installments and interest.",
      icon: <Calculator className="text-emerald-500" size={20} />,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      borderColor: "hover:border-emerald-500/20"
    },
    {
      id: "normal-calculator",
      title: "Normal Calculator",
      desc: "Quickly compute expenses and bills.",
      icon: <Calculator className="text-[#8B5CF6]" size={20} />,
      gradient: "from-[#8B5CF6]/10 to-[#8B5CF6]/5",
      borderColor: "hover:border-[#8B5CF6]/20"
    },
    {
      id: "currency-converter",
      title: "Currency Converter",
      desc: "Convert USD, INR, EUR, GBP, JPY instantly.",
      icon: <Coins className="text-[#FF5CA8]" size={20} />,
      gradient: "from-[#FF5CA8]/10 to-[#FF5CA8]/5",
      borderColor: "hover:border-[#FF5CA8]/20"
    },
    {
      id: "financial-tips",
      title: "Financial Tips",
      desc: "Money saving tips and student guides.",
      icon: <BookOpen className="text-[#8B5CF6]" size={20} />,
      gradient: "from-[#8B5CF6]/10 to-[#8B5CF6]/5",
      borderColor: "hover:border-[#8B5CF6]/20"
    },
    {
      id: "todo-list",
      title: "Budget Todo List",
      desc: "Maintain financial habits & checklist.",
      icon: <ListTodo className="text-[#FF5CA8]" size={20} />,
      gradient: "from-[#FF5CA8]/10 to-[#FF5CA8]/5",
      borderColor: "hover:border-[#FF5CA8]/20"
    }
  ];

  // ================= EXPORT DATA REAL LOGIC =================
  const handleExportCSV = () => {
    if (recentTransactions.length === 0) {
      alert("No transaction ledger data to export.");
      return;
    }

    // Build standard CSV
    const headers = ["ID", "Amount", "Bucket", "Category", "Date", "Note", "Reviewed", "Justified"];
    const rows = recentTransactions.map(tx => [
      tx.id,
      tx.amount,
      tx.bucket,
      tx.category,
      tx.date,
      `"${(tx.note || "").replace(/"/g, '""')}"`,
      tx.reviewed ? "YES" : "NO",
      tx.justified ? "YES" : "NO"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cashtrack_ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Save timestamp
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " on " + new Date().toLocaleDateString();
    localStorage.setItem("cashtrack_last_export", nowStr);
    setLastExportTime(nowStr);
    alert("✅ CSV report downloaded successfully!");
  };

  // ================= BUDGET UPDATE REAL LOGIC =================
  const handleSaveBudget = async () => {
    const budgetNum = parseFloat(tempBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) return;
    setIsUpdatingBudget(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudget: budgetNum })
      });
      if (res.ok) {
        onRefresh();
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem("cashtrack_last_budget_update", `₹${budgetNum} at ${nowStr}`);
        setLastBudgetUpdated(`₹${budgetNum} at ${nowStr}`);
        setSelectedTool(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingBudget(false);
    }
  };



  // ================= TODO LIST LOGIC =================
  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    const newTodo = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false,
      category: newTodoCategory
    };
    setTodos([...todos, newTodo]);
    setNewTodoText("");
  };

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const handleClearCompletedTodos = () => {
    setTodos(todos.filter(t => !t.completed));
  };

  // ================= EMI CALCULATION LOGIC =================
  const computeEMI = () => {
    const P = emiPrincipal;
    const r = (emiRate / 12) / 100;
    const n = emiTenure;
    if (r === 0) return { emi: P / n, total: P, interest: 0 };
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - P;
    return {
      emi: Math.round(emi),
      total: Math.round(totalPayable),
      interest: Math.round(totalInterest)
    };
  };

  const emiData = computeEMI();

  // ================= CURRENCY CONVERSION REAL LOGIC =================
  const ratesInINR: { [key: string]: number } = {
    INR: 1.0,
    USD: 83.45,
    EUR: 90.62,
    GBP: 106.15,
    JPY: 0.54, // 1 JPY = 0.54 INR
  };

  const getConvertedVal = () => {
    const amountInINR = convAmount * (ratesInINR[convSource] || 1);
    const converted = amountInINR / (ratesInINR[convTarget] || 1);
    return converted.toFixed(2);
  };

  // ================= FINANCIAL TIPS DATA =================
  const financialTips = [
    {
      title: "The Tapri Trap",
      desc: "That daily ₹15 cutting chai with a ₹10 biscuit adds up to ₹750 a month! Log everything, even small coins. You'll be surprised where it goes.",
      icon: <Coffee size={24} className="text-amber-500" />
    },
    {
      title: "The 70/20/10 Standard",
      desc: "Allocate 70% of allowance to essential needs (rent, tiffin, metro), 20% to fun desires (cafes, movies), and save/invest the remaining 10% immediately.",
      icon: <Percent size={24} className="text-[#8B5CF6]" />
    },
    {
      title: "The 24-Hour Cool-off",
      desc: "Before making an online checkout for Wants, wait 24 hours. Most of the time, the impulse fades and you save thousands.",
      icon: <Sparkles size={24} className="text-blue-500" />
    },
    {
      title: "Review & Justify",
      desc: "Use CashTrack reflection triggers. Tagging your expenses as 'Justified' or 'Avoidable' changes your future spending psychology instantly.",
      icon: <Target size={24} className="text-[#FF5CA8]" />
    },
    {
      title: "Subscription Audit",
      desc: "Sharing is caring. Audit Spotify, Netflix, or prime packages. Share student plans with friends to cut costs by 75%!",
      icon: <Coins size={24} className="text-emerald-500" />
    }
  ];

  return (
    <PageLayout id="tools-view" className="space-y-6 animate-fadeIn">
      {/* 1. Header Area */}
      <div className="space-y-1 py-2">
        <h1 className="text-xl font-black text-[#111111] dark:text-white tracking-tight">Tools</h1>
        <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold leading-relaxed">Everything you need to manage your finances.</p>
      </div>

      {/* 2. Grid of 12 Tool Cards */}
      <div className="grid grid-cols-2 gap-3.5">
        {toolsList.map((tool) => (
          <motion.button
            key={tool.id}
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (tool.id === "export-data") {
                handleExportCSV();
              } else {
                setSelectedTool(tool.id);
              }
            }}
            className={`bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 ${tool.borderColor} rounded-[24px] p-5 text-left transition-colors flex flex-col justify-between h-[155px] cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.01)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.4)] relative overflow-hidden outline-none`}
          >
            {/* Soft glass accent */}
            <div className={`absolute top-0 right-0 w-16 h-16 bg-[#8B5CF6]/5 dark:bg-[#8B5CF6]/10 rounded-bl-full pointer-events-none`} />

            {/* Icon (top left) */}
            <div className="w-10 h-10 rounded-[16px] bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 flex items-center justify-center shadow-inner">
              {tool.icon}
            </div>

            {/* Title & Description & Arrow */}
            <div className="space-y-1 pr-4">
              <h3 className="text-[13px] font-black text-[#111111] dark:text-white tracking-tight flex items-center gap-1">
                {tool.title}
              </h3>
              <p className="text-[10px] text-[#707070] dark:text-[#C6CBD8] font-semibold leading-tight line-clamp-2">{tool.desc}</p>
            </div>

            <ChevronRight size={13} className="text-[#707070] dark:text-[#8B93A7] absolute bottom-5 right-5" />
          </motion.button>
        ))}
      </div>

      {/* 3. Quick Actions Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#707070] dark:text-[#8B93A7]">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onOpenAddExpense}
            className="bg-[#FF5CA8] hover:bg-[#ff3c96] text-white py-3 px-4 rounded-[20px] text-xs font-black transition-colors active:scale-95 cursor-pointer shadow-md shadow-[#FF5CA8]/10 flex items-center justify-center gap-1.5"
          >
            <Plus size={14} strokeWidth={2.5} /> Add Expense
          </button>
          
          <button
            onClick={() => setSelectedTool("budget-planner")}
            className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/10 hover:bg-[#F8F8FA] dark:hover:bg-[#202534] text-[#111111] dark:text-white py-3 px-4 rounded-[20px] text-xs font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            Set Monthly Budget
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/10 hover:bg-[#F8F8FA] dark:hover:bg-[#202534] text-[#111111] dark:text-white py-3 px-4 rounded-[20px] text-xs font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            Export Report
          </button>

          <button
            onClick={() => onNavigate("analysis")}
            className="bg-[#8B5CF6]/10 dark:bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/15 dark:hover:bg-[#8B5CF6]/30 text-[#8B5CF6] dark:text-purple-300 py-3 px-4 rounded-[20px] text-xs font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-[#8B5CF6]/10 dark:border-[#8B5CF6]/30"
          >
            View Analytics
          </button>
        </div>
      </div>

      {/* 4. Recent Activity Log Panel */}
      <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 rounded-[24px] p-5 space-y-4 shadow-[0_4px_18px_rgba(0,0,0,0.015)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#FF5CA8]" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#111111] dark:text-white">Recent Activity</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px] font-medium text-[#707070] dark:text-[#C6CBD8]">
          <div className="bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 p-3 rounded-[16px] space-y-0.5">
            <span className="text-[8px] font-bold uppercase tracking-wider block text-gray-400 dark:text-[#8B93A7]">Last Export</span>
            <span className="text-[#111111] dark:text-white font-black truncate block">{lastExportTime}</span>
          </div>

          <div className="bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 p-3 rounded-[16px] space-y-0.5">
            <span className="text-[8px] font-bold uppercase tracking-wider block text-gray-400 dark:text-[#8B93A7]">Budget Limit</span>
            <span className="text-[#111111] dark:text-white font-black truncate block">₹{monthlyBudget.toLocaleString("en-IN")}</span>
          </div>

          <div className="bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 p-3 rounded-[16px] space-y-0.5">
            <span className="text-[8px] font-bold uppercase tracking-wider block text-gray-400 dark:text-[#8B93A7]">Latest Transaction</span>
            <span className="text-[#111111] dark:text-white font-black truncate block">
              {recentTransactions[0] ? `₹${recentTransactions[0].amount} (${recentTransactions[0].category.replace("Food ??", "")})` : "No entries"}
            </span>
          </div>

          <div className="bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 p-3 rounded-[16px] space-y-0.5">
            <span className="text-[8px] font-bold uppercase tracking-wider block text-gray-400 dark:text-[#8B93A7]">Recent Category</span>
            <span className="text-[#111111] dark:text-white font-black truncate block">
              {recentTransactions[0] ? recentTransactions[0].category : "None created"}
            </span>
          </div>
        </div>
      </div>

      {/* ================= MODAL INTERACTIVE PORTALS (AnimatePresence Overlay) ================= */}
      <AnimatePresence>
        {selectedTool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#111111]/35 z-50 flex items-end justify-center"
            onClick={() => setSelectedTool(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 210 }}
              className="bg-white dark:bg-[#202534] rounded-t-[32px] w-full max-w-lg p-6 space-y-5 max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl border-t border-[#ECECEC] dark:border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header inside modal */}
              <div className="flex justify-between items-center border-b border-[#ECECEC] dark:border-white/10 pb-3.5">
                <h3 className="text-sm font-black text-[#111111] dark:text-white uppercase tracking-widest flex items-center gap-2">
                  {selectedTool === "budget-planner" && <>?📊 Budget Planner</>}
                  {selectedTool === "expense-reports" && <>🧾 Expense Reports</>}
                  {selectedTool === "category-manager" && <>🗂️ Category Manager</>}
                  {selectedTool === "spending-trends" && <>📈 Spending Trends</>}

                  {selectedTool === "spending-alerts" && <>🔔 Spending Alerts</>}
                  {selectedTool === "normal-calculator" && <>🧮 Normal Calculator</>}
                  {selectedTool === "emi-calculator" && <>🏦 EMI Calculator</>}
                  {selectedTool === "currency-converter" && <>💱 Currency Converter</>}
                  {selectedTool === "financial-tips" && <>💡 Financial Tips</>}
                  {selectedTool === "todo-list" && <>✅ Budget Todo List</>}
                </h3>
                <button
                  onClick={() => setSelectedTool(null)}
                  className="w-8 h-8 rounded-full bg-[#F8F8FA] dark:bg-[#171A23] flex items-center justify-center text-[#707070] dark:text-[#C6CBD8] border border-[#ECECEC] dark:border-white/10 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Dynamic Modal Renderers */}
              <div className="pt-1">
                {/* 1. BUDGET PLANNER */}
                {selectedTool === "budget-planner" && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold leading-relaxed">
                      Edit your targeted monthly limit. Spending over this will trigger red overrun warnings.
                    </p>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[#707070] dark:text-[#8B93A7]">Monthly Budget Limit (INR)</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 font-bold text-xs text-[#707070] dark:text-[#C6CBD8] font-mono">₹</span>
                        <input
                          type="number"
                          value={tempBudget}
                          onChange={(e) => setTempBudget(e.target.value)}
                          className="w-full bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[14px] py-3.5 pl-8 pr-4 text-xs font-black text-[#111111] dark:text-white focus:outline-none focus:border-[#FF5CA8] transition-colors font-mono"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSaveBudget}
                      disabled={isUpdatingBudget}
                      className="w-full bg-[#FF5CA8] hover:bg-[#ff3c96] text-white font-black py-3.5 rounded-[16px] text-xs transition-colors active:scale-95 shadow-md cursor-pointer"
                    >
                      {isUpdatingBudget ? "Saving changes..." : "Save Budget Limit"}
                    </button>
                  </div>
                )}

                {/* 3. EXPENSE REPORTS */}
                {selectedTool === "expense-reports" && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold">
                      Your high-level multi-interval report card.
                    </p>

                    <div className="space-y-3 bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 p-4 rounded-[20px]">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#707070] dark:text-[#C6CBD8] font-bold">Total Spent (Current Period)</span>
                        <span className="text-[#111111] dark:text-white font-black font-mono">₹{totalSpend.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-[#ECECEC]/50 dark:border-white/10 pt-2.5">
                        <span className="text-[#707070] dark:text-[#C6CBD8] font-bold">Derived Monthly Savings</span>
                        <span className="text-emerald-500 dark:text-emerald-400 font-black font-mono">₹{Math.max(monthlyBudget - totalSpend, 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-[#ECECEC]/50 dark:border-white/10 pt-2.5">
                        <span className="text-[#707070] dark:text-[#C6CBD8] font-bold">Projected Yearly Outlay</span>
                        <span className="text-[#FF5CA8] font-black font-mono">₹{(totalSpend * 12).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-[#ECECEC]/50 dark:border-white/10 pt-2.5">
                        <span className="text-[#707070] dark:text-[#C6CBD8] font-bold">Average Single Ticket</span>
                        <span className="text-[#111111] dark:text-white font-black font-mono">
                          ₹{recentTransactions.length > 0 ? Math.round(totalSpend / recentTransactions.length) : 0}
                        </span>
                      </div>
                    </div>

                    {/* Sector Distribution */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#707070] dark:text-[#8B93A7]">Sector Allocations</h4>
                      <div className="space-y-2">
                        {bucketSummary.map((b) => (
                          <div key={b.bucket} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-[#111111] dark:text-white">{b.bucket}</span>
                              <span className="font-bold dark:text-white">₹{Math.round(b.amount)} ({Math.round(b.limitPercentage)}%)</span>
                            </div>
                            <div className="w-full bg-[#F8F8FA] dark:bg-[#171A23] h-2.5 border border-[#ECECEC] dark:border-white/10 rounded-full overflow-hidden">
                              <div className={`h-full ${b.bucket === "Needs" ? "bg-[#22C55E]" : b.bucket === "Wants" ? "bg-[#FF5CA8]" : "bg-[#8B5CF6]"}`} style={{ width: `${Math.min(b.limitPercentage, 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CATEGORY MANAGER */}
                {selectedTool === "category-manager" && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold">
                      Your current cash allocation breakdown across active categories.
                    </p>

                    <div className="space-y-3 max-h-[45vh] overflow-y-auto no-scrollbar pr-1">
                      {categorySummary.length > 0 ? (
                        categorySummary.map((cat, idx) => (
                          <div key={idx} className="bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[18px] p-3.5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              {getCategoryIcon(cat.category)}
                              <div>
                                <div className="text-xs font-black text-[#111111] dark:text-white">{cat.category.replace("Food ??", "")}</div>
                                <span className="text-[9px] font-bold text-[#707070] dark:text-[#C6CBD8] uppercase bg-white dark:bg-[#202534] px-2 py-0.5 rounded-full border border-[#ECECEC] dark:border-white/10">
                                  {cat.bucket}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-black text-[#FF5CA8]">₹{Math.round(cat.amount)}</div>
                              <span className="text-[9px] text-[#707070] dark:text-[#C6CBD8] font-bold">{Math.round(cat.percentage)}% of limit</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-xs text-[#707070] dark:text-[#C6CBD8] italic">
                          No category entries logged yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. SPENDING TRENDS */}
                {selectedTool === "spending-trends" && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold leading-relaxed">
                      Review systemic patterns and audit the sanity of your cash outflows.
                    </p>

                    {/* Sanity Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[20px] p-4 text-center">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#707070] dark:text-[#8B93A7]">Avoidable Spend</span>
                        <div className="text-base font-black text-[#EF4444] mt-1">
                          ₹{recentTransactions.filter(t => t.reviewed && !t.justified).reduce((s, t) => s + t.amount, 0).toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div className="bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[20px] p-4 text-center">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#707070] dark:text-[#8B93A7]">Justified Spend</span>
                        <div className="text-base font-black text-emerald-500 dark:text-emerald-400 mt-1">
                          ₹{recentTransactions.filter(t => t.reviewed && t.justified).reduce((s, t) => s + t.amount, 0).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[20px] p-4 space-y-3.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#707070] dark:text-[#C6CBD8] font-bold">Active Logging Health</span>
                        <span className={`font-black uppercase tracking-wider ${
                          totalSpend > monthlyBudget ? "text-[#EF4444]" : "text-emerald-500 dark:text-emerald-400"
                        }`}>
                          {totalSpend > monthlyBudget ? "Over Limit! 🚨" : totalSpend > monthlyBudget * 0.8 ? "Warning! ⚠️" : "Excellent! 🎉"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-[#ECECEC]/50 dark:border-white/10 pt-2.5">
                        <span className="text-[#707070] dark:text-[#C6CBD8] font-bold">Highest Ticket Value</span>
                        <span className="text-[#111111] dark:text-white font-black font-mono">
                          ₹{recentTransactions.length > 0 ? Math.max(...recentTransactions.map(t => t.amount)) : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. SPENDING ALERTS */}
                {selectedTool === "spending-alerts" && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold leading-relaxed">
                      Configure automated limits. We will warn you visually if individual transactions exceed this limit.
                    </p>

                    <div className="space-y-4 bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[24px] p-5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-[#111111] dark:text-white">Large Ticket Flagging</span>
                          <p className="text-[10px] text-[#707070] dark:text-[#C6CBD8] font-medium">Highlight logs over threshold value</p>
                        </div>
                        <button
                          onClick={() => {
                            const next = !isAlertEnabled;
                            setIsAlertEnabled(next);
                            localStorage.setItem("cashtrack_alert_enabled", String(next));
                          }}
                          className={`w-11 h-6 rounded-full transition-colors duration-300 relative cursor-pointer outline-none ${
                            isAlertEnabled ? "bg-[#FF5CA8]" : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-colors ${
                            isAlertEnabled ? "left-6" : "left-1"
                          }`} />
                        </button>
                      </div>

                      {isAlertEnabled && (
                        <div className="space-y-1.5 border-t border-[#ECECEC] dark:border-white/10 pt-3.5 animate-fadeIn">
                          <label className="text-[9px] font-black uppercase tracking-wider text-[#707070] dark:text-[#C6CBD8]">Single Log Threshold Limit</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-3.5 font-bold text-xs text-[#707070] dark:text-[#C6CBD8]">₹</span>
                            <input
                              type="number"
                              value={alertThreshold}
                              onChange={(e) => {
                                setAlertThreshold(e.target.value);
                                localStorage.setItem("cashtrack_alert_threshold", e.target.value);
                              }}
                              className="w-full bg-white dark:bg-[#202534] border border-[#ECECEC] dark:border-white/10 rounded-[12px] py-2.5 pl-7 pr-3 text-xs font-bold text-[#111111] dark:text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 9. EMI CALCULATOR */}
                {selectedTool === "emi-calculator" && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold leading-relaxed">
                      Useful for students figuring out laptop, smartphone or college course installments.
                    </p>

                    <div className="space-y-3.5 bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[20px] p-4 text-xs">
                      <div className="flex justify-between font-bold dark:text-white">
                        <span>Monthly Installment (EMI)</span>
                        <span className="text-[#FF5CA8] font-black">₹{emiData.emi.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#ECECEC]/50 dark:border-white/10 pt-2.5 dark:text-white">
                        <span>Total Interest Payable</span>
                        <span className="text-[#111111] dark:text-white font-black">₹{emiData.interest.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#ECECEC]/50 dark:border-white/10 pt-2.5 dark:text-white">
                        <span>Total Amount Payable</span>
                        <span className="text-[#111111] dark:text-white font-black">₹{emiData.total.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black text-[#707070] dark:text-[#C6CBD8] uppercase tracking-wider">
                          <span>Principal Amount</span>
                          <span>₹{emiPrincipal.toLocaleString("en-IN")}</span>
                        </div>
                        <input
                          type="range"
                          min="5000"
                          max="200000"
                          step="5000"
                          value={emiPrincipal}
                          onChange={(e) => setEmiPrincipal(Number(e.target.value))}
                          className="w-full accent-[#FF5CA8]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#707070] dark:text-[#C6CBD8] uppercase tracking-wider block">Interest Rate (%)</label>
                          <input
                            type="number"
                            value={emiRate}
                            onChange={(e) => setEmiRate(Number(e.target.value))}
                            className="w-full bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-xl p-2.5 text-xs font-black font-mono text-[#111111] dark:text-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#707070] dark:text-[#C6CBD8] uppercase tracking-wider block">Tenure (Months)</label>
                          <input
                            type="number"
                            value={emiTenure}
                            onChange={(e) => setEmiTenure(Number(e.target.value))}
                            className="w-full bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-xl p-2.5 text-xs font-black font-mono text-[#111111] dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                 {/* NORMAL CALCULATOR */}
                {selectedTool === "normal-calculator" && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold leading-relaxed">
                      Perform quick, simple calculations for budget allocations and transaction totals.
                    </p>

                    {/* Calculator Screen Display */}
                    <div className="bg-[#111111] text-white rounded-[24px] p-6 text-right space-y-1 shadow-inner relative overflow-hidden">
                      <div className="absolute top-3 left-4 text-[10px] font-black uppercase text-gray-500 tracking-wider">
                        {calcPrev && `${calcPrev} ${calcOp}`}
                      </div>
                      <div className="text-3xl font-black font-mono overflow-x-auto whitespace-nowrap no-scrollbar pt-2">
                        {calcInput}
                      </div>
                    </div>

                    {/* Calculator Buttons Grid */}
                    <div className="grid grid-cols-4 gap-2.5">
                      {/* Row 1 */}
                      <button
                        onClick={() => handleCalcBtn("C")}
                        className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[#111111] dark:text-white h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
                      >
                        C
                      </button>
                      <button
                        onClick={() => handleCalcBtn("⌫")}
                        className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[#111111] dark:text-white h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
                      >
                        ⌫                      </button>
                      <button
                        onClick={() => handleCalcBtn("/")}
                        className="bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-purple-300 h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#8B5CF6]/20 font-mono"
                      >
                        ?
                      </button>
                      <button
                        onClick={() => handleCalcBtn("*")}
                        className="bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-purple-300 h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#8B5CF6]/20 font-mono"
                      >
                        ?
                      </button>

                      {/* Row 2 */}
                      <button
                        onClick={() => handleCalcBtn("7")}
                        className="bg-[#F8F8FA] dark:bg-[#171A23] hover:bg-gray-100 dark:hover:bg-white/10 text-[#111111] dark:text-white h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#ECECEC] dark:border-white/10"
                      >
                        7
                      </button>
                      <button
                        onClick={() => handleCalcBtn("8")}
                        className="bg-[#F8F8FA] dark:bg-[#171A23] hover:bg-gray-100 dark:hover:bg-white/10 text-[#111111] dark:text-white h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#ECECEC] dark:border-white/10"
                      >
                        8
                      </button>
                      <button
                        onClick={() => handleCalcBtn("9")}
                        className="bg-[#F8F8FA] dark:bg-[#171A23] hover:bg-gray-100 dark:hover:bg-white/10 text-[#111111] dark:text-white h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#ECECEC] dark:border-white/10"
                      >
                        9
                      </button>
                      <button
                        onClick={() => handleCalcBtn("-")}
                        className="bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-purple-300 h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#8B5CF6]/20 font-mono"
                      >
                        -
                      </button>

                      {/* Row 3 */}
                      <button
                        onClick={() => handleCalcBtn("4")}
                        className="bg-[#F8F8FA] dark:bg-[#171A23] hover:bg-gray-100 dark:hover:bg-white/10 text-[#111111] dark:text-white h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#ECECEC] dark:border-white/10"
                      >
                        4
                      </button>
                      <button
                        onClick={() => handleCalcBtn("5")}
                        className="bg-[#F8F8FA] dark:bg-[#171A23] hover:bg-gray-100 dark:hover:bg-white/10 text-[#111111] dark:text-white h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#ECECEC] dark:border-white/10"
                      >
                        5
                      </button>
                      <button
                        onClick={() => handleCalcBtn("6")}
                        className="bg-[#F8F8FA] dark:bg-[#171A23] hover:bg-gray-100 dark:hover:bg-white/10 text-[#111111] dark:text-white h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#ECECEC] dark:border-white/10"
                      >
                        6
                      </button>
                      <button
                        onClick={() => handleCalcBtn("+")}
                        className="bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-purple-300 h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#8B5CF6]/20 font-mono"
                      >
                        +
                      </button>

                      {/* Row 4 */}
                      <button
                        onClick={() => handleCalcBtn("1")}
                        className="bg-[#F8F8FA] dark:bg-[#171A23] hover:bg-gray-100 dark:hover:bg-white/10 text-[#111111] dark:text-white h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#ECECEC] dark:border-white/10"
                      >
                        1
                      </button>
                      <button
                        onClick={() => handleCalcBtn("2")}
                        className="bg-[#F8F8FA] dark:bg-[#171A23] hover:bg-gray-100 dark:hover:bg-white/10 text-[#111111] dark:text-white h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#ECECEC] dark:border-white/10"
                      >
                        2
                      </button>
                      <button
                        onClick={() => handleCalcBtn("3")}
                        className="bg-[#F8F8FA] dark:bg-[#171A23] hover:bg-gray-100 dark:hover:bg-white/10 text-[#111111] dark:text-white h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#ECECEC] dark:border-white/10"
                      >
                        3
                      </button>
                      <button
                        onClick={() => handleCalcBtn("=")}
                        className="bg-[#FF5CA8] hover:bg-[#ff3c96] text-white h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center shadow-md shadow-[#FF5CA8]/15"
                      >
                        =
                      </button>

                      {/* Row 5 */}
                      <button
                        onClick={() => handleCalcBtn("0")}
                        className="bg-[#F8F8FA] dark:bg-[#171A23] hover:bg-gray-100 dark:hover:bg-white/10 text-[#111111] dark:text-white h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#ECECEC] dark:border-white/10 col-span-2"
                      >
                        0
                      </button>
                      <button
                        onClick={() => handleCalcBtn(".")}
                        className="bg-[#F8F8FA] dark:bg-[#171A23] hover:bg-gray-100 dark:hover:bg-white/10 text-[#111111] dark:text-white h-14 rounded-[18px] text-sm font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center border border-[#ECECEC] dark:border-white/10"
                      >
                        .
                      </button>
                      <div className="h-14 rounded-[18px] bg-[#F8F8FA]/50 dark:bg-[#171A23]/50 border border-dashed border-[#ECECEC] dark:border-white/10 flex items-center justify-center text-[10px] text-gray-400 dark:text-[#8B93A7] font-bold">
                        calc
                      </div>
                    </div>
                  </div>
                )}

                {/* 10. CURRENCY CONVERTER */}
                {selectedTool === "currency-converter" && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold">
                      Convert foreign currencies instantly at local standard exchange rates.
                    </p>

                    <div className="bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[24px] p-5 space-y-4">
                      {/* Source currency input */}
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={convAmount}
                          onChange={(e) => setConvAmount(Number(e.target.value))}
                          className="flex-1 bg-white dark:bg-[#202534] border border-[#ECECEC] dark:border-white/10 rounded-[14px] p-3 text-sm font-black font-mono text-[#111111] dark:text-white focus:outline-none focus:border-[#FF5CA8]"
                        />
                        <select
                          value={convSource}
                          onChange={(e) => setConvSource(e.target.value)}
                          className="bg-white dark:bg-[#202534] border border-[#ECECEC] dark:border-white/10 rounded-[14px] px-4 py-3 text-xs font-black text-[#111111] dark:text-white"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="JPY">JPY (¥)</option>
                        </select>
                      </div>

                      {/* Swap indicator */}
                      <div className="flex justify-center -my-2 relative z-10">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-[#202534] border border-[#ECECEC] dark:border-white/10 flex items-center justify-center text-[#FF5CA8] font-bold shadow-sm">
                          ⇄                        </div>
                      </div>

                      {/* Destination Currency result */}
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white dark:bg-[#202534] border border-[#ECECEC] dark:border-white/10 rounded-[14px] p-3 text-sm font-black font-mono text-[#707070] dark:text-[#C6CBD8] flex items-center">
                          {getConvertedVal()}
                        </div>
                        <select
                          value={convTarget}
                          onChange={(e) => setConvTarget(e.target.value)}
                          className="bg-white dark:bg-[#202534] border border-[#ECECEC] dark:border-white/10 rounded-[14px] px-4 py-3 text-xs font-black text-[#111111] dark:text-white"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="JPY">JPY (¥)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. FINANCIAL TIPS */}
                {selectedTool === "financial-tips" && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold leading-relaxed">
                      Guides curated specifically for college students to build financial discipline.
                    </p>

                    <div className="bg-[#8B5CF6]/5 dark:bg-[#8B5CF6]/10 border border-[#ECECEC] dark:border-white/10 rounded-[24px] p-6 text-center space-y-3 relative overflow-hidden">
                      <div className="absolute top-2 right-4 text-xs font-black opacity-30 text-[#111111] dark:text-white">
                        {tipIndex + 1} / {financialTips.length}
                      </div>

                      <div className="text-4xl">{financialTips[tipIndex].icon}</div>
                      <h4 className="text-sm font-black text-[#111111] dark:text-white tracking-tight">{financialTips[tipIndex].title}</h4>
                      <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold leading-relaxed max-w-xs mx-auto">
                        "{financialTips[tipIndex].desc}"
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => setTipIndex(p => Math.max(0, p - 1))}
                        disabled={tipIndex === 0}
                        className="px-4 py-2 text-xs font-bold bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 text-[#111111] dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl disabled:opacity-50 cursor-pointer"
                      >
                        Prev Tip
                      </button>

                      <button
                        onClick={() => setTipIndex(p => Math.min(financialTips.length - 1, p + 1))}
                        disabled={tipIndex === financialTips.length - 1}
                        className="px-4 py-2 text-xs font-black bg-[#FF5CA8] text-white hover:bg-[#ff3c96] rounded-xl disabled:opacity-50 shadow-md shadow-[#FF5CA8]/10 cursor-pointer"
                      >
                        Next Tip
                      </button>
                    </div>
                  </div>
                )}

                {/* 13. TODO LIST */}
                {selectedTool === "todo-list" && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold leading-relaxed">
                      Keep track of financial habits, bill payments, and budget checkpoints.
                    </p>

                    {/* Todo stats */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#707070] dark:text-[#C6CBD8] bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 px-3.5 py-2.5 rounded-[16px]">
                      <span>Progress: {todos.filter(t => t.completed).length}/{todos.length} done</span>
                      <button 
                        onClick={handleClearCompletedTodos}
                        className="text-[#FF5CA8] hover:underline cursor-pointer bg-transparent border-none font-bold"
                        disabled={todos.filter(t => t.completed).length === 0}
                      >
                        Clear Completed
                      </button>
                    </div>

                    {/* Todo Input Area */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTodoText}
                          onChange={(e) => setNewTodoText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTodo();
                          }}
                          placeholder="Add new budget task..."
                          className="flex-1 bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[14px] p-3 text-xs font-bold text-[#111111] dark:text-white focus:outline-none focus:border-[#FF5CA8] transition-colors"
                        />
                        <button
                          onClick={handleAddTodo}
                          className="bg-[#FF5CA8] hover:bg-[#ff3c96] text-white p-3 rounded-[14px] text-xs font-black transition-colors active:scale-95 cursor-pointer flex items-center justify-center w-10 h-10 shadow-sm"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#707070] dark:text-[#C6CBD8]">Category:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {["General", "Budget", "Bills", "Savings", "Audit"].map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setNewTodoCategory(cat)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                                newTodoCategory === cat
                                  ? "bg-[#8B5CF6]/10 dark:bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-purple-300 border-[#8B5CF6]/30"
                                  : "bg-white dark:bg-[#171A23] border-[#ECECEC] dark:border-white/10 text-[#707070] dark:text-[#C6CBD8]"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Todo Filters */}
                    <div className="flex border-b border-[#ECECEC] dark:border-white/10 gap-4">
                      {(["all", "pending", "completed"] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setTodoFilter(filter)}
                          className={`pb-2 text-xs font-black capitalize transition-colors cursor-pointer relative ${
                            todoFilter === filter ? "text-[#111111] dark:text-white" : "text-[#707070] dark:text-[#8B93A7] hover:text-[#111111] dark:hover:text-white"
                          }`}
                        >
                          {filter}
                          {todoFilter === filter && (
                            <motion.span
                              layoutId="todo-filter-indicator"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5CA8]"
                            />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Todo List Display */}
                    <div className="space-y-2 max-h-[35vh] overflow-y-auto no-scrollbar pr-1">
                      {todos.filter(t => {
                        if (todoFilter === "pending") return !t.completed;
                        if (todoFilter === "completed") return t.completed;
                        return true;
                      }).length > 0 ? (
                        todos.filter(t => {
                          if (todoFilter === "pending") return !t.completed;
                          if (todoFilter === "completed") return t.completed;
                          return true;
                        }).map((todo) => (
                          <div
                            key={todo.id}
                            className="flex items-center justify-between p-3.5 bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/10 rounded-[18px] hover:border-[#FF5CA8]/30 transition-colors group"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <button
                                onClick={() => handleToggleTodo(todo.id)}
                                className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors cursor-pointer ${
                                  todo.completed
                                    ? "bg-[#FF5CA8] border-[#FF5CA8] text-white"
                                    : "border-[#ECECEC] dark:border-white/20 bg-[#F8F8FA] dark:bg-[#171A23] hover:border-gray-400"
                                }`}
                              >
                                {todo.completed && <Check size={12} strokeWidth={3} />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <span className={`text-xs font-semibold block truncate ${
                                  todo.completed ? "text-gray-400 dark:text-gray-500 line-through" : "text-[#111111] dark:text-white"
                                }`}>
                                  {todo.text}
                                </span>
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  todo.category === "Budget" ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300" :
                                  todo.category === "Bills" ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300" :
                                  todo.category === "Savings" ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300" :
                                  todo.category === "Audit" ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300" :
                                  "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                                }`}>
                                  {todo.category}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="text-gray-400 dark:text-[#8B93A7] hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                              title="Delete task"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 bg-[#F8F8FA] dark:bg-[#171A23] rounded-[20px] border border-[#ECECEC]/50 dark:border-white/10">
                          <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold">✅ All tasks completed or filter is empty!</p>
                        </div>
                      )}
                    </div>

                    {/* Presets / Suggestions */}
                    <div className="space-y-2 pt-2 border-t border-[#ECECEC]/50 dark:border-white/10">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-[#707070] dark:text-[#C6CBD8]">Suggested Financial Routines</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { text: "Verify today's cash spends", category: "Audit" },
                          { text: "Set side budget for weekend", category: "Budget" },
                          { text: "Move ₹100 to savings box", category: "Savings" },
                          { text: "Cancel unused online trial", category: "Bills" }
                        ].map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (todos.some(t => t.text === p.text && !t.completed)) return;
                              setTodos([...todos, {
                                id: Date.now().toString() + idx,
                                text: p.text,
                                completed: false,
                                category: p.category
                              }]);
                            }}
                            className="bg-[#F8F8FA] dark:bg-[#171A23] hover:bg-[#F0F0F3] dark:hover:bg-white/10 border border-[#ECECEC] dark:border-white/10 p-2.5 rounded-[14px] text-left transition-colors text-[10px] font-bold text-[#111111] dark:text-white cursor-pointer flex items-center justify-between"
                          >
                            <span>{p.text}</span>
                            <Plus size={10} className="text-[#FF5CA8]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}

export default React.memo(Tools);
