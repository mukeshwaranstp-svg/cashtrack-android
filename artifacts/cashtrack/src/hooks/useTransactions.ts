import { useEffect, useState } from 'react';
import type { Transaction } from '@/types';
import { fetchTransactions } from '@/data';

interface UseTransactionsResult {
  transactions: Transaction[];
  isLoading: boolean;
}

/**
 * Loads transactions through the simulated API layer (`@/data`). Pages
 * consume this hook instead of importing mock data directly, so swapping
 * `fetchTransactions` for a real HTTP call later requires no page changes.
 */
export function useTransactions(): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchTransactions().then((data) => {
      if (active) {
        setTransactions(data);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { transactions, isLoading };
}
