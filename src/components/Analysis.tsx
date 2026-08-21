import React, { useState } from "react";
import { motion } from "motion/react";
import { SummaryData, Expense } from "../types";
import PageLayout from "./PageLayout";
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Sparkles,
  Info,
  Coffee,
  Car,
  ShoppingBag,
  Activity,
  Heart,
  BookOpen,
  Receipt
} from "lucide-react";

interface AnalysisProps {
  data: SummaryData | null;
  onRefresh: () => void;
}

export function Analysis({ data, onRefresh }: AnalysisProps) {
  // Interactive line chart states
  const [activeLines, setActiveLines] = useState({
    needs: true,
    wants: true,
    savings: true
  });
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  if (!data) {
    return (
      <div id="analysis-skeleton" className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-[3.5px] border-[#ECECEC] border-t-[#FF5CA8] rounded-full animate-spin" />
          <div className="absolute w-6 h-6 bg-[#FF5CA8]/10 rounded-full animate-ping" />
        </div>
        <p className="text-xs font-semibold text-[#707070] tracking-wide animate-pulse">Syncing premium ledger...</p>
      </div>
    );
  }

  const {
    bucketSummary, categorySummary, weeklyTrend, recentTransactions,
    monthlyBudget, totalSpend, lastMonthSpend,
  } = data;

  // ---- REAL bucket totals for this month (no placeholders) ----
  const bucketAmount = (b: "Needs" | "Wants" | "Savings") =>
    bucketSummary.find((x) => x.bucket === b)?.amount ?? 0;
  const spentNeeds = bucketAmount("Needs");
  const spentWants = bucketAmount("Wants");
  const savedSavings = bucketAmount("Savings");
  const totalCombined = spentNeeds + spentWants + savedSavings;
  const hasData = totalCombined > 0;
  const pct = (v: number) => (totalCombined > 0 ? (v / totalCombined) * 100 : 0);

  // ---- REAL last-7-days trend, split into Needs/Wants/Savings ----
  const chartData = {
    labels: weeklyTrend.map((t) => t.label),
    needs: weeklyTrend.map((t) => t.needs),
    wants: weeklyTrend.map((t) => t.wants),
    savings: weeklyTrend.map((t) => t.savings),
  };
  const numPoints = chartData.labels.length;

  // Map coordinates for viewBox="0 0 500 240"
  const chartWidth = 500;
  const chartHeight = 240;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 35;

  const getCoords = (dataList: number[]) => {
    const maxVal = Math.max(
      ...chartData.needs,
      ...chartData.wants,
      ...chartData.savings,
      1000
    ) * 1.15;

    return dataList.map((val, i) => {
      const x = paddingLeft + (i / (numPoints - 1)) * (chartWidth - paddingLeft - paddingRight);
      const y = chartHeight - paddingBottom - (val / maxVal) * (chartHeight - paddingTop - paddingBottom);
      return { x, y, value: val };
    });
  };

  const needsCoords = getCoords(chartData.needs);
  const wantsCoords = getCoords(chartData.wants);
  const savingsCoords = getCoords(chartData.savings);

  // Bezier curve smooth generator
  const getBezierPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp1y = p0.y;
      const cp2x = p0.x + (2 * (p1.x - p0.x)) / 3;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const getAreaPath = (points: { x: number; y: number }[]) => {
    const linePath = getBezierPath(points);
    if (!linePath) return "";
    return `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;
  };

  // Determine single point for tooltip popover
  const currentHoverIndex = hoveredPointIdx !== null ? hoveredPointIdx : Math.floor(numPoints / 2);

  // ---- REAL category breakdown (this month, only non-zero categories) ----
  const categoryExtras: Record<string, { color: string; border: string; icon: React.ReactNode }> = {
    "Food": { color: "bg-[#FF5CA8]", border: "border-[#FF5CA8]/20", icon: <Coffee size={12} className="text-[#FF5CA8]" /> },
    "Rent": { color: "bg-[#8B5CF6]", border: "border-[#8B5CF6]/20", icon: <Target size={12} className="text-[#8B5CF6]" /> },
    "Transport": { color: "bg-[#3B82F6]", border: "border-[#3B82F6]/20", icon: <Car size={12} className="text-[#3B82F6]" /> },
    "Shopping": { color: "bg-[#F59E0B]", border: "border-[#F59E0B]/20", icon: <ShoppingBag size={12} className="text-[#F59E0B]" /> },
    "Entertainment": { color: "bg-[#EC4899]", border: "border-[#EC4899]/20", icon: <Sparkles size={12} className="text-[#EC4899]" /> },
    "Medical": { color: "bg-[#EF4444]", border: "border-[#EF4444]/20", icon: <Heart size={12} className="text-[#EF4444]" /> },
    "Education": { color: "bg-[#10B981]", border: "border-[#10B981]/20", icon: <BookOpen size={12} className="text-[#10B981]" /> },
    "Bills": { color: "bg-[#06B6D4]", border: "border-[#06B6D4]/20", icon: <Receipt size={12} className="text-[#06B6D4]" /> },
    "Utilities": { color: "bg-[#14B8A6]", border: "border-[#14B8A6]/20", icon: <Receipt size={12} className="text-[#14B8A6]" /> },
    "Mobile & Internet": { color: "bg-[#6366F1]", border: "border-[#6366F1]/20", icon: <Receipt size={12} className="text-[#6366F1]" /> },
    "Coffee & Cafes": { color: "bg-[#F59E0B]", border: "border-[#F59E0B]/20", icon: <Coffee size={12} className="text-[#F59E0B]" /> },
    "Dining Out": { color: "bg-[#EF4444]", border: "border-[#EF4444]/20", icon: <Coffee size={12} className="text-[#EF4444]" /> },
    "Gaming": { color: "bg-[#8B5CF6]", border: "border-[#8B5CF6]/20", icon: <Sparkles size={12} className="text-[#8B5CF6]" /> },
    "Gifts": { color: "bg-[#EC4899]", border: "border-[#EC4899]/20", icon: <Sparkles size={12} className="text-[#EC4899]" /> },
    "Travel": { color: "bg-[#3B82F6]", border: "border-[#3B82F6]/20", icon: <Car size={12} className="text-[#3B82F6]" /> },
    "Fun": { color: "bg-[#EC4899]", border: "border-[#EC4899]/20", icon: <Sparkles size={12} className="text-[#EC4899]" /> },
  };

  const dynamicCategories = categorySummary
    .filter((c) => c.amount > 0)
    .map((c) => {
      const extra = categoryExtras[c.category] || {
        color: "bg-[#707070]",
        border: "border-[#707070]/20",
        icon: <Activity size={12} className="text-[#707070]" />,
      };
      return {
        name: c.category,
        amount: c.amount,
        percentage: c.percentage,
        color: extra.color,
        border: extra.border,
        icon: extra.icon,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // ---- REAL daily trend (last 7 days) ----
  const dailyBars = weeklyTrend.map((t) => t.amount);
  const dailyMax = Math.max(...dailyBars, 1);
  const avgDailySpend = Math.round(weeklyTrend.reduce((s, t) => s + t.amount, 0) / 7);

  // ---- REAL month-over-month comparison ----
  const monthDiff = totalSpend - lastMonthSpend;
  const pctChange = lastMonthSpend > 0 ? (monthDiff / lastMonthSpend) * 100 : 0;
  const spentLess = monthDiff < 0;
  const savingsRate = pct(savedSavings);

  // ---- REAL highest expense ----
  const highestExpense = recentTransactions.reduce<Expense | null>(
    (max, e) => (max === null || e.amount > max.amount ? e : max),
    null,
  );
  const formatShortDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  // ---- REAL monthly goal = Savings bucket vs the 10% savings target ----
  const savingsTarget = monthlyBudget * 0.1;
  const savingsProgress = savingsTarget > 0 ? Math.min((savedSavings / savingsTarget) * 100, 100) : 0;

  // ---- REAL donut distribution (actual % shares) ----
  const donutSegments = [
    { pct: Math.round(pct(spentNeeds)), color: "#10B981", label: "N" },
    { pct: Math.round(pct(spentWants)), color: "#F59E0B", label: "W" },
    { pct: Math.round(pct(savedSavings)), color: "#3B82F6", label: "S" },
  ];
  const donutOffsets = donutSegments.reduce<number[]>((acc, _seg, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + donutSegments[i - 1].pct);
    return acc;
  }, []);

  // ---- REAL insights (generated from actual data) ----
  const insights: {
    icon: React.ReactNode; card: string; iconBox: string; sub: string;
    title: string; subtitle: string;
  }[] = [];
  if (!hasData) {
    insights.push({
      icon: <Sparkles size={14} />,
      card: "bg-[#FF5CA8]/5 border border-[#FF5CA8]/10",
      iconBox: "bg-[#FF5CA8]/10 text-[#FF5CA8]",
      sub: "text-[#FF5CA8]",
      title: "No spending data yet",
      subtitle: "Log your first expense and your analysis, trends and insights will appear here.",
    });
  } else {
    const biggest = dynamicCategories[0];
    if (biggest) {
      insights.push({
        icon: <Info size={14} />,
        card: "bg-[#8B5CF6]/5 border border-[#8B5CF6]/10",
        iconBox: "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400",
        sub: "text-purple-700 dark:text-purple-400",
        title: `${biggest.name} is your highest expense`,
        subtitle: `${biggest.name} made up ${Math.round(biggest.percentage)}% of this month's spending.`,
      });
    }
    const overBudget = bucketSummary.find((b) => b.isOverBudget);
    if (overBudget) {
      insights.push({
        icon: <Award size={14} />,
        card: "bg-[#F59E0B]/5 border border-[#F59E0B]/10",
        iconBox: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
        sub: "text-amber-700 dark:text-amber-400",
        title: `${overBudget.bucket} is over its budget target`,
        subtitle: `${overBudget.bucket} has used ${Math.round(overBudget.limitPercentage)}% of its ${Math.round(overBudget.targetPercentage)}% target.`,
      });
    } else {
      insights.push({
        icon: <Award size={14} />,
        card: "bg-[#10B981]/5 border border-[#10B981]/10",
        iconBox: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400",
        sub: "text-emerald-700 dark:text-emerald-400",
        title: "You're within your budget targets",
        subtitle: "Every bucket stays inside its 70/20/10 target this month.",
      });
    }
    insights.push({
      icon: spentLess ? <TrendingDown size={14} /> : <TrendingUp size={14} />,
      card: spentLess ? "bg-[#10B981]/5 border border-[#10B981]/10" : "bg-[#EF4444]/5 border border-[#EF4444]/10",
      iconBox: spentLess ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400",
      sub: spentLess ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
      title: spentLess ? "You spent less than last month" : "You spent more than last month",
      subtitle: `${Math.abs(pctChange).toFixed(1)}% ${spentLess ? "down" : "up"} compared to the previous month.`,
    });
    insights.push({
      icon: <Target size={14} />,
      card: "bg-[#EC4899]/5 border border-[#EC4899]/10",
      iconBox: "bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-400",
      sub: "text-pink-700 dark:text-pink-400",
      title: `Savings share is ${Math.round(savingsRate)}% of spending`,
      subtitle: `You've saved ₹${savedSavings.toLocaleString("en-IN")} toward the 10% savings goal.`,
    });
  }

  return (
    <PageLayout id="premium-analysis-viewport" className="space-y-6">
      
      {/* ====================================
          TOP HEADER
          ==================================== */}
      <div className="py-2">
        <h1 className="text-xl font-black text-[#111111] dark:text-white tracking-tight">Analysis</h1>
        <p className="text-xs text-[#707070] dark:text-[#C6CBD8] font-semibold mt-0.5">Understand your spending habits</p>
      </div>

      {/* ====================================
          MAIN CHART
          ==================================== */}
      <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 rounded-[24px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.015)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.4)] space-y-4 relative overflow-hidden">
        
        {/* Interactive Legends & Line Toggles */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#707070] dark:text-[#8B93A7]">Line Allocation Filters</span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveLines(prev => ({ ...prev, needs: !prev.needs }))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-colors cursor-pointer ${
                activeLines.needs 
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50" 
                  : "bg-white dark:bg-[#171A23] text-gray-400 border-gray-100 dark:border-white/10"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeLines.needs ? "bg-emerald-500" : "bg-gray-300"}`} />
              Needs
            </button>
            <button
              onClick={() => setActiveLines(prev => ({ ...prev, wants: !prev.wants }))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-colors cursor-pointer ${
                activeLines.wants 
                  ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50" 
                  : "bg-white dark:bg-[#171A23] text-gray-400 border-gray-100 dark:border-white/10"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeLines.wants ? "bg-amber-500" : "bg-gray-300"}`} />
              Wants
            </button>
            <button
              onClick={() => setActiveLines(prev => ({ ...prev, savings: !prev.savings }))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-colors cursor-pointer ${
                activeLines.savings 
                  ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50" 
                  : "bg-white dark:bg-[#171A23] text-gray-400 border-gray-100 dark:border-white/10"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeLines.savings ? "bg-blue-500" : "bg-gray-300"}`} />
              Savings
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Tooltip Area */}
        <div className="bg-[#F8F8FA] dark:bg-[#171A23] border border-[#ECECEC] dark:border-white/10 rounded-[18px] p-3 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#707070] dark:text-[#C6CBD8]">
              Period Point: <span className="text-[#111111] dark:text-white font-extrabold">{chartData.labels[currentHoverIndex]}</span>
            </span>
          </div>
          <div className="flex gap-3 text-[11px] font-extrabold">
            {activeLines.needs && (
              <span className="text-emerald-600 dark:text-emerald-400">Needs: ₹{chartData.needs[currentHoverIndex]}</span>
            )}
            {activeLines.wants && (
              <span className="text-amber-600 dark:text-amber-400">Wants: ₹{chartData.wants[currentHoverIndex]}</span>
            )}
            {activeLines.savings && (
              <span className="text-blue-600 dark:text-blue-400">Savings: ₹{chartData.savings[currentHoverIndex]}</span>
            )}
          </div>
        </div>

        {/* SVG Multi-line Graph Container */}
        <div className="relative h-48 w-full">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <defs>
              <linearGradient id="needsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="wantsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Light Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = paddingTop + ratio * (chartHeight - paddingTop - paddingBottom);
              return (
                <line
                  key={idx}
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  className="stroke-[#F1F1F4] dark:stroke-white/10"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              );
            })}

            {/* Vertical grid line for hovered point */}
            {currentHoverIndex !== null && (
              <line
                x1={needsCoords[currentHoverIndex]?.x || 0}
                y1={paddingTop}
                x2={needsCoords[currentHoverIndex]?.x || 0}
                y2={chartHeight - paddingBottom}
                stroke="#FF5CA8"
                strokeWidth="1.5"
                strokeDasharray="3,3"
                opacity="0.6"
              />
            )}

            {/* Gradients Filled Under Curved Lines */}
            {activeLines.needs && (
              <path d={getAreaPath(needsCoords)} fill="url(#needsGrad)" />
            )}
            {activeLines.wants && (
              <path d={getAreaPath(wantsCoords)} fill="url(#wantsGrad)" />
            )}
            {activeLines.savings && (
              <path d={getAreaPath(savingsCoords)} fill="url(#savingsGrad)" />
            )}

            {/* Smooth Curved Line Strokes */}
            {activeLines.needs && (
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                d={getBezierPath(needsCoords)}
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
            {activeLines.wants && (
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.15 }}
                d={getBezierPath(wantsCoords)}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
            {activeLines.savings && (
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                d={getBezierPath(savingsCoords)}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}

            {/* Point Markers (Circle Point Nodes) */}
            {needsCoords.map((pt, i) => (
              <g key={i} className="cursor-pointer">
                {/* Background larger tap zone */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="16"
                  fill="transparent"
                  onMouseEnter={() => setHoveredPointIdx(i)}
                  onTouchStart={() => setHoveredPointIdx(i)}
                />
                {activeLines.needs && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={currentHoverIndex === i ? "6" : "3.5"}
                    fill="#10B981"
                    className="stroke-white dark:stroke-[#1D212D] transition-colors duration-150"
                    strokeWidth={currentHoverIndex === i ? "2.5" : "1.5"}
                  />
                )}
                {activeLines.wants && (
                  <circle
                    cx={wantsCoords[i].x}
                    cy={wantsCoords[i].y}
                    r={currentHoverIndex === i ? "6" : "3.5"}
                    fill="#F59E0B"
                    className="stroke-white dark:stroke-[#1D212D] transition-colors duration-150"
                    strokeWidth={currentHoverIndex === i ? "2.5" : "1.5"}
                  />
                )}
                {activeLines.savings && (
                  <circle
                    cx={savingsCoords[i].x}
                    cy={savingsCoords[i].y}
                    r={currentHoverIndex === i ? "6" : "3.5"}
                    fill="#3B82F6"
                    className="stroke-white dark:stroke-[#1D212D] transition-colors duration-150"
                    strokeWidth={currentHoverIndex === i ? "2.5" : "1.5"}
                  />
                )}
              </g>
            ))}

            {/* X-Axis labels */}
            {chartData.labels.map((label, idx) => {
              const x = paddingLeft + (idx / (numPoints - 1)) * (chartWidth - paddingLeft - paddingRight);
              return (
                <text
                  key={idx}
                  x={x}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  className="fill-[#707070] dark:fill-[#C6CBD8] text-[10px] font-black"
                >
                  {label}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ====================================
          SUMMARY CARDS
          ==================================== */}
      <div className="grid grid-cols-3 gap-3">
        {/* Card 1: Needs */}
        <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 rounded-[24px] p-3.5 shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Needs</span>
            <div className="text-sm font-black text-[#111111] dark:text-white mt-1">₹{spentNeeds.toLocaleString("en-IN")}</div>
            <div className="text-[9px] text-[#707070] dark:text-[#C6CBD8] font-bold mt-0.5">Target: 70%</div>
          </div>
          <div className="w-full bg-[#F1F1F4] dark:bg-[#2B3040] h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min((spentNeeds / totalCombined) * 100 || 70, 100)}%` }} />
          </div>
        </div>

        {/* Card 2: Wants */}
        <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 rounded-[24px] p-3.5 shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Wants</span>
            <div className="text-sm font-black text-[#111111] dark:text-white mt-1">₹{spentWants.toLocaleString("en-IN")}</div>
            <div className="text-[9px] text-[#707070] dark:text-[#C6CBD8] font-bold mt-0.5">Target: 20%</div>
          </div>
          <div className="w-full bg-[#F1F1F4] dark:bg-[#2B3040] h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min((spentWants / totalCombined) * 100 || 20, 100)}%` }} />
          </div>
        </div>

        {/* Card 3: Savings */}
        <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 rounded-[24px] p-3.5 shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Savings</span>
            <div className="text-sm font-black text-[#111111] dark:text-white mt-1">₹{savedSavings.toLocaleString("en-IN")}</div>
            <div className="text-[9px] text-[#707070] dark:text-[#C6CBD8] font-bold mt-0.5">Target: 10%</div>
          </div>
          <div className="w-full bg-[#F1F1F4] dark:bg-[#2B3040] h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min((savedSavings / totalCombined) * 100 || 10, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* ====================================
          CATEGORY BREAKDOWN
          ==================================== */}
      <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 rounded-[24px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.015)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.4)] space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#111111] dark:text-white">Category Spending</h3>
          <span className="text-[10px] text-[#707070] dark:text-[#C6CBD8] font-bold">Relative Share</span>
        </div>

        <div className="space-y-3.5">
          {dynamicCategories.map((cat, idx) => {
            const percentage = cat.percentage;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 font-bold text-[#111111] dark:text-white">
                    <div className="p-1 rounded-[8px] bg-gray-50 dark:bg-white/10 border border-gray-100 dark:border-white/10">
                      {cat.icon}
                    </div>
                    <span>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-black text-[#111111] dark:text-white">
                    <span>₹{cat.amount.toLocaleString("en-IN")}</span>
                    <span className="text-[9px] text-[#707070] dark:text-[#C6CBD8] font-bold">({Math.round(percentage)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-[#F8F8FA] dark:bg-[#2B3040] border border-[#ECECEC]/70 dark:border-white/10 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${cat.color}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================
          SPENDING DISTRIBUTION & DAILY TREND (GRID)
          ==================================== */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Donut Chart Component */}
        <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 rounded-[24px] p-4 shadow-sm flex flex-col justify-between h-[200px]">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-[#707070] dark:text-[#8B93A7]">Distribution</h4>
          
          <div className="relative w-full flex items-center justify-center h-28">
            {/* SVG Ring Donut */}
            <svg className="w-24 h-24 transform -rotate-90 overflow-visible" viewBox="0 0 36 36">
              {hasData ? donutSegments.map((seg, i) => (
                <circle
                  key={seg.label}
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="3.2"
                  strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                  strokeDashoffset={-donutOffsets[i]}
                />
              )) : (
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  className="stroke-[#F1F1F4] dark:stroke-white/10"
                  strokeWidth="3.2"
                />
              )}
            </svg>
            
            {/* Center value */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-black uppercase text-[#707070] dark:text-[#C6CBD8] leading-none">Budget</span>
              <span className="text-[11px] font-black text-[#111111] dark:text-white mt-0.5">₹{monthlyBudget.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="flex justify-between text-[8px] font-black text-[#707070] uppercase px-1">
            <span className="text-emerald-600 dark:text-emerald-400">N: {donutSegments[0].pct}%</span>
            <span className="text-amber-600 dark:text-amber-400">W: {donutSegments[1].pct}%</span>
            <span className="text-blue-600 dark:text-blue-400">S: {donutSegments[2].pct}%</span>
          </div>
        </div>

        {/* Daily Spending Trend (Mini Bar Chart) */}
        <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 rounded-[24px] p-4 shadow-sm flex flex-col justify-between h-[200px]">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-[#707070] dark:text-[#8B93A7]">Daily Trend</h4>
            <span className="text-[8px] font-bold text-gray-400 dark:text-[#C6CBD8]">Last 7d</span>
          </div>

          {/* Animated Bars */}
          <div className="flex items-end justify-between h-28 px-1">
            {dailyBars.map((amt, i) => {
              const heightPercent = dailyMax > 0 ? (amt / dailyMax) * 100 : 0;
              const barColors = ["bg-[#FF5CA8]", "bg-[#8B5CF6]", "bg-[#3B82F6]", "bg-rose-500", "bg-[#10B981]", "bg-amber-500", "bg-cyan-500"];
              return (
                <div key={i} className="flex flex-col items-center flex-1 group relative">
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-colors text-[8px] font-black bg-black text-white px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                    ₹{amt.toLocaleString("en-IN")}
                  </div>
                  <div className="w-2.5 bg-gray-50 dark:bg-white/10 border border-gray-100 dark:border-white/10 rounded-full h-24 flex items-end overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className={`w-full rounded-full ${barColors[i % barColors.length]} ${amt === 0 ? "opacity-30" : ""}`}
                    />
                  </div>
                  <span className="text-[7px] text-gray-400 dark:text-[#C6CBD8] font-extrabold mt-1.5 uppercase">
                    {chartData.labels[i]?.slice(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-[8px] font-black text-center text-[#707070] dark:text-[#C6CBD8] uppercase">
            Avg Spent: ₹{avgDailySpend.toLocaleString("en-IN")} / day
          </div>
        </div>
      </div>

      {/* ====================================
          MONTHLY COMPARISON
          ==================================== */}
      <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 rounded-[24px] p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-[#FF5CA8]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#111111] dark:text-white">Monthly Comparison</h3>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#707070] dark:text-[#8B93A7]">Budget Timeline</span>
            <div className="text-xs font-black text-[#111111] dark:text-white mt-0.5">Current Month vs Last Month</div>
          </div>
          {lastMonthSpend > 0 && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${spentLess ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"}`}>
              {spentLess ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
              <span>{Math.abs(pctChange).toFixed(1)}% {spentLess ? "decrease" : "increase"}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#707070] dark:text-[#8B93A7]">Spend Difference</span>
            <div className={`text-sm font-black ${lastMonthSpend > 0 ? (spentLess ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400") : "text-[#707070] dark:text-[#8B93A7]"}`}>
              {lastMonthSpend > 0
                ? `${spentLess ? "-" : "+"}₹${Math.abs(monthDiff).toLocaleString("en-IN")} ${spentLess ? "saved" : "vs last month"}`
                : "No last month data"}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#707070] dark:text-[#8B93A7]">Savings Rate</span>
            <div className="text-sm font-black text-blue-600 dark:text-blue-400">{savingsRate.toFixed(1)}% overall</div>
          </div>
        </div>
      </div>

      {/* ====================================
          BIGGEST EXPENSE & GOAL TRACKER (GRID)
          ==================================== */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Highest Expense Card */}
        <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 rounded-[24px] p-4.5 shadow-sm flex flex-col justify-between h-[160px]">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-[#707070] dark:text-[#8B93A7]">Highest Expense</span>
            <div className="text-xl font-black text-[#111111] dark:text-white mt-1">
              {highestExpense ? `₹${highestExpense.amount.toLocaleString("en-IN")}` : "₹"}
            </div>
            <div className="text-xs font-black text-[#FF5CA8] mt-1.5">
              {highestExpense ? highestExpense.category : "No expenses yet"}
            </div>
          </div>
          <span className="text-[9px] font-bold text-gray-400 dark:text-[#8B93A7]">
            {highestExpense ? `Date: ${formatShortDate(highestExpense.date)}` : ""}
          </span>
        </div>

        {/* Goal Tracker with Progress Ring */}
        <div className="bg-white dark:bg-[#1D212D] border border-[#ECECEC] dark:border-white/5 rounded-[24px] p-4.5 shadow-sm flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-[#707070] dark:text-[#8B93A7]">Monthly Goal</span>
              <div className="text-xs font-black text-[#111111] dark:text-white mt-0.5">
                {savingsTarget > 0 ? `Save ₹${Math.round(savingsTarget).toLocaleString("en-IN")}` : "No savings target"}
              </div>
            </div>
            
            {/* SVG Mini Progress Ring */}
            <div className="relative w-10 h-10">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  className="stroke-[#F1F1F4] dark:stroke-white/10"
                  strokeWidth="3.2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3.2"
                  strokeDasharray={`${savingsProgress} ${100 - savingsProgress}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-[#111111] dark:text-white">
                {Math.round(savingsProgress)}%
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase tracking-wider text-[#707070] dark:text-[#8B93A7]">Current Saved</span>
            <div className="text-sm font-black text-blue-600 dark:text-blue-400">₹{savedSavings.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      {/* ====================================
          INSIGHTS
          ==================================== */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#FF5CA8]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#111111] dark:text-white">Smart Analysis Insights</h3>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {insights.map((insight, idx) => (
            <div key={idx} className={`${insight.card} rounded-[18px] p-3.5 flex items-start gap-3`}>
              <div className={`p-1.5 ${insight.iconBox} rounded-[10px] shrink-0`}>
                {insight.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-[#111111] dark:text-white">{insight.title}</p>
                <p className={`text-[10px] ${insight.sub} font-semibold mt-0.5`}>{insight.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </PageLayout>
  );
}

export default React.memo(Analysis);
