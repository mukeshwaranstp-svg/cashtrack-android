/**
 * Simulated API layer. Each function returns a Promise, matching the shape
 * a real `fetch()` call to a future FastAPI backend would have -- so
 * swapping the implementation later requires no changes to consuming
 * hooks or components.
 */
import type { Budget, Category, Streak, Transaction } from '@/types';
import { budgets } from './budgets';
import { categories } from './categories';
import { streak } from './streak';
import { transactions } from './transactions';

export { budgets, categories, streak, transactions };

export function fetchTransactions(): Promise<Transaction[]> {
  return Promise.resolve(transactions);
}

export function fetchCategories(): Promise<Category[]> {
  return Promise.resolve(categories);
}

export function fetchBudgets(): Promise<Budget[]> {
  return Promise.resolve(budgets);
}

export function fetchStreak(): Promise<Streak> {
  return Promise.resolve(streak);
}
