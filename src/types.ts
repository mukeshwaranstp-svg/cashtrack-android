export interface Expense {
  id: string;
  amount: number;
  category: string;
  bucket: 'Needs' | 'Wants' | 'Savings';
  note: string;
  timestamp: string;
  date: string;
  reviewed: boolean;
  justified: boolean;
  goalId?: string;
  goalName?: string;
  goalImage?: string;
  allocations?: Record<string, number>;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_logged_date: string | null;
  logged_today: boolean;
}

export interface BucketSummary {
  bucket: 'Needs' | 'Wants' | 'Savings';
  amount: number;
  targetPercentage: number;
  relativePercentage: number;
  limitPercentage: number;
  isOverBudget: boolean;
  targetAmount: number;
}

export interface CategorySummary {
  category: string;
  amount: number;
  bucket: 'Needs' | 'Wants' | 'Savings';
  percentage: number;
}

export interface HeatmapDay {
  date: string;
  amount: number;
  isOverBudget: boolean;
}

export interface WeeklyTrendDay {
  date: string;
  amount: number;
  label: string;
  needs: number;
  wants: number;
  savings: number;
}

export interface SummaryData {
  totalSpend: number;
  monthlyBudget: number;
  dailyThreshold: number;
  bucketSummary: BucketSummary[];
  categorySummary: CategorySummary[];
  heatmap: HeatmapDay[];
  weeklyTrend: WeeklyTrendDay[];
  recentTransactions: Expense[];
  lastMonthSpend: number;
  streak: Streak;
}
