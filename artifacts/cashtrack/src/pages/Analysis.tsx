import { useState, useMemo, useEffect } from 'react';
import { ScreenContainer } from '@/components/layout';
import { MonthNavigation } from '@/components/analysis/MonthNavigation';
import { HeatmapCalendar } from '@/components/analysis/HeatmapCalendar';
import { DailySpendDetails } from '@/components/analysis/DailySpendDetails';
import { WeeklyTrendChart } from '@/components/analysis/WeeklyTrendChart';
import { AnalysisDonutChart } from '@/components/analysis/AnalysisDonutChart';
import { CategoryBreakdown } from '@/components/analysis/CategoryBreakdown';
import { OverBudgetIndicators } from '@/components/analysis/OverBudgetIndicators';
import { useTransactions, useBudgets, useCategories } from '@/hooks';
import { addMonths, subMonths, startOfMonth, format, isFuture } from 'date-fns';

export function Analysis() {
  const { transactions, isLoading: txLoading } = useTransactions();
  const { budgets, isLoading: bdgLoading } = useBudgets();
  const { categories, isLoading: catLoading } = useCategories();
  
  // By default look at the most recent transaction month, or just current date if none
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-07-15T00:00:00.000Z'));
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date('2026-07-14T00:00:00.000Z'));

  useEffect(() => {
    if (transactions.length > 0) {
      const dates = transactions.map(t => new Date(t.timestamp).getTime());
      const latestDate = new Date(Math.max(...dates));
      setCurrentDate(latestDate);
      setSelectedDate(latestDate);
    }
  }, [transactions]);

  const isLoading = txLoading || bdgLoading || catLoading;

  // Filter transactions for the current viewing month
  const monthTransactions = useMemo(() => {
    const monthStr = format(currentDate, 'yyyy-MM');
    return transactions.filter(t => t.timestamp.startsWith(monthStr));
  }, [transactions, currentDate]);

  const monthBudget = useMemo(() => {
    const monthStr = format(currentDate, 'yyyy-MM');
    return budgets.find(b => b.month === monthStr) || null;
  }, [budgets, currentDate]);

  if (isLoading) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-semibold tracking-wide">Loading Analysis...</div>
      </ScreenContainer>
    );
  }

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const nextMonthDate = addMonths(currentDate, 1);
  const disableNext = isFuture(nextMonthDate) || (transactions.length > 0 && nextMonthDate.getTime() > Math.max(...transactions.map(t => new Date(t.timestamp).getTime())));

  return (
    <ScreenContainer className="pt-6 px-4 sm:px-6 pb-28 gap-6">
      <div className="flex flex-col">
        <span className="label-caps text-primary mb-1">Analysis</span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Spending Insights</h1>
      </div>

      <MonthNavigation 
        currentDate={currentDate} 
        onPrevMonth={handlePrevMonth} 
        onNextMonth={handleNextMonth} 
        disableNext={false} // Disable logic could be tighter, leaving free navigation for now
      />

      {monthBudget && (
        <OverBudgetIndicators 
          allocations={monthBudget.allocations} 
          income={monthBudget.income} 
        />
      )}

      <HeatmapCalendar 
        currentDate={currentDate} 
        transactions={monthTransactions} 
        selectedDate={selectedDate} 
        onSelectDate={setSelectedDate} 
      />

      <DailySpendDetails 
        date={selectedDate} 
        transactions={monthTransactions} 
      />

      <WeeklyTrendChart 
        currentDate={currentDate} 
        transactions={monthTransactions} 
      />

      {monthBudget && (
        <AnalysisDonutChart allocations={monthBudget.allocations} />
      )}

      <CategoryBreakdown 
        transactions={monthTransactions} 
        categories={categories} 
      />
    </ScreenContainer>
  );
}
