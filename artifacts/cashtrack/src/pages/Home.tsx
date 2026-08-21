import { useMemo } from 'react';
import { ScreenContainer } from '@/components/layout';
import { Header } from '@/components/home/Header';
import { HeroCard } from '@/components/home/HeroCard';
import { MonthlyCard } from '@/components/home/MonthlyCard';
import { BudgetTabs } from '@/components/home/BudgetTabs';
import { OverviewChart } from '@/components/home/OverviewChart';
import { RecentTransactions } from '@/components/home/RecentTransactions';
import { useTransactions, useBudgets, useCategories, useStreak } from '@/hooks';

export function Home() {
  const { transactions, isLoading: txLoading } = useTransactions();
  const { budgets, isLoading: bdgLoading } = useBudgets();
  const { categories, isLoading: catLoading } = useCategories();
  const { streak, isLoading: strLoading } = useStreak();

  const isLoading = txLoading || bdgLoading || catLoading || strLoading;

  const currentBudget = useMemo(() => {
    return budgets.length > 0 ? budgets[0] : null;
  }, [budgets]);

  const hasLoggedToday = useMemo(() => {
    if (transactions.length === 0) return false;
    const mostRecentDate = new Date(Math.max(...transactions.map(t => new Date(t.timestamp).getTime())));
    const todayStr = mostRecentDate.toISOString().split('T')[0];
    return transactions.some(t => t.timestamp.startsWith(todayStr));
  }, [transactions]);

  if (isLoading) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-semibold tracking-wide">Loading Dashboard...</div>
      </ScreenContainer>
    );
  }

  const monthlySpent = currentBudget?.allocations.reduce((sum, a) => sum + a.spent, 0) || 0;
  const prevBudget = budgets.length > 1 ? budgets[1] : null;
  const prevSpent = prevBudget?.allocations.reduce((sum, a) => sum + a.spent, 0) || 0;
  const trend = prevSpent > 0 ? (monthlySpent - prevSpent) / prevSpent : 0;

  return (
    <ScreenContainer className="pt-0 px-4 sm:px-6 pb-28">
      <Header streakCount={streak?.currentStreak ?? 0} />
      
      <div className="flex flex-col gap-6 pt-3 pb-8">
        <HeroCard hasLoggedToday={hasLoggedToday} />
        
        <MonthlyCard spent={monthlySpent} trend={trend} />
        
        {currentBudget && (
          <BudgetTabs 
            allocations={currentBudget.allocations} 
            transactions={transactions} 
            categories={categories}
            income={currentBudget.income} 
          />
        )}
        
        {currentBudget && (
          <OverviewChart allocations={currentBudget.allocations} />
        )}
        
        <RecentTransactions transactions={transactions} />
      </div>
    </ScreenContainer>
  );
}
