import type { Category } from '@/types';

/**
 * Mock response for a future `GET /categories` endpoint.
 * Colors are hex values so they can be handed directly to chart libraries.
 */
export const categories: Category[] = [
  { id: 'cat_rent', name: 'Rent & Utilities', bucket: 'needs', icon: 'FaHome', color: '#D4AF37' },
  { id: 'cat_groceries', name: 'Groceries', bucket: 'needs', icon: 'FaShoppingBasket', color: '#D4AF37' },
  { id: 'cat_transport', name: 'Transport', bucket: 'needs', icon: 'FaCar', color: '#D4AF37' },
  { id: 'cat_insurance', name: 'Insurance', bucket: 'needs', icon: 'FaShieldAlt', color: '#D4AF37' },
  { id: 'cat_dining', name: 'Dining Out', bucket: 'wants', icon: 'FaUtensils', color: '#E63946' },
  { id: 'cat_entertainment', name: 'Entertainment', bucket: 'wants', icon: 'FaFilm', color: '#E63946' },
  { id: 'cat_shopping', name: 'Shopping', bucket: 'wants', icon: 'FaShoppingBag', color: '#E63946' },
  { id: 'cat_travel', name: 'Travel', bucket: 'wants', icon: 'FaPlane', color: '#E63946' },
  { id: 'cat_savings', name: 'Savings', bucket: 'savings', icon: 'FaPiggyBank', color: '#9A9A9E' },
  { id: 'cat_investing', name: 'Investing', bucket: 'savings', icon: 'FaChartLine', color: '#9A9A9E' },
  { id: 'cat_debt', name: 'Debt Payoff', bucket: 'savings', icon: 'FaHandHoldingUsd', color: '#9A9A9E' },
];
