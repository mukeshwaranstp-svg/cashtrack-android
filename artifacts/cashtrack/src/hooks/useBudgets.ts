import { useEffect, useState } from 'react';
import type { Budget } from '@/types';
import { fetchBudgets } from '@/data';

interface UseBudgetsResult {
  budgets: Budget[];
  isLoading: boolean;
}

export function useBudgets(): UseBudgetsResult {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchBudgets().then((data) => {
      if (active) {
        setBudgets(data);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { budgets, isLoading };
}
