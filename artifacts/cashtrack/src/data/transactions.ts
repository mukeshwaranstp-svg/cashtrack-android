import type { Transaction } from '@/types';

/**
 * Mock response for a future `GET /transactions` endpoint.
 * Timestamps are realistic ISO 8601 strings spanning the current month.
 */
export const transactions: Transaction[] = [
  // June
  { id: 'txn_j01', amount: 1800, category: 'Rent & Utilities', bucket: 'needs', note: 'June rent', timestamp: '2026-06-01T09:00:00.000Z', emoji: '🏠' },
  { id: 'txn_j02', amount: 120, category: 'Groceries', bucket: 'needs', note: 'Trader Joes', timestamp: '2026-06-05T18:22:00.000Z', emoji: '🥗' },
  { id: 'txn_j03', amount: 65, category: 'Transport', bucket: 'needs', note: 'Gas fill-up', timestamp: '2026-06-10T08:15:00.000Z', emoji: '⛽' },
  { id: 'txn_j04', amount: 85, category: 'Dining Out', bucket: 'wants', note: 'Dinner with friends', timestamp: '2026-06-15T20:45:00.000Z', emoji: '🍷' },
  { id: 'txn_j05', amount: 200, category: 'Savings', bucket: 'savings', note: 'Auto-transfer to savings', timestamp: '2026-06-20T07:00:00.000Z', emoji: '🏦' },
  { id: 'txn_j06', amount: 150, category: 'Shopping', bucket: 'wants', note: 'Clothes', timestamp: '2026-06-25T14:30:00.000Z', emoji: '👟' },
  { id: 'txn_j07', amount: 300, category: 'Travel', bucket: 'wants', note: 'Flight', timestamp: '2026-06-28T21:00:00.000Z', emoji: '🧳' },
  { id: 'txn_j08', amount: 90, category: 'Groceries', bucket: 'needs', note: 'Farmers market', timestamp: '2026-06-30T11:10:00.000Z', emoji: '🥬' },

  // July
  { id: 'txn_001', amount: 1850, category: 'Rent & Utilities', bucket: 'needs', note: 'July rent', timestamp: '2026-07-01T09:00:00.000Z', emoji: '🏠' },
  { id: 'txn_002', amount: 132.47, category: 'Groceries', bucket: 'needs', note: 'Whole Foods run', timestamp: '2026-07-02T18:22:00.000Z', emoji: '🥗' },
  { id: 'txn_003', amount: 58.0, category: 'Transport', bucket: 'needs', note: 'Gas fill-up', timestamp: '2026-07-03T08:15:00.000Z', emoji: '⛽' },
  { id: 'txn_004', amount: 64.99, category: 'Dining Out', bucket: 'wants', note: 'Dinner with friends', timestamp: '2026-07-03T20:45:00.000Z', emoji: '🍷' },
  { id: 'txn_005', amount: 15.99, category: 'Entertainment', bucket: 'wants', note: 'Streaming subscription', timestamp: '2026-07-04T12:00:00.000Z', emoji: '📺' },
  { id: 'txn_006', amount: 210.0, category: 'Savings', bucket: 'savings', note: 'Auto-transfer to savings', timestamp: '2026-07-05T07:00:00.000Z', emoji: '🏦' },
  { id: 'txn_007', amount: 89.5, category: 'Shopping', bucket: 'wants', note: 'New running shoes', timestamp: '2026-07-06T14:30:00.000Z', emoji: '👟' },
  { id: 'txn_008', amount: 145.0, category: 'Insurance', bucket: 'needs', note: 'Auto insurance premium', timestamp: '2026-07-07T09:00:00.000Z', emoji: '🛡️' },
  { id: 'txn_009', amount: 42.3, category: 'Groceries', bucket: 'needs', note: 'Farmers market', timestamp: '2026-07-08T11:10:00.000Z', emoji: '🥬' },
  { id: 'txn_010', amount: 120.0, category: 'Investing', bucket: 'savings', note: 'Index fund contribution', timestamp: '2026-07-09T07:00:00.000Z', emoji: '📈' },
  { id: 'txn_011', amount: 27.5, category: 'Dining Out', bucket: 'wants', note: 'Coffee & lunch', timestamp: '2026-07-10T13:05:00.000Z', emoji: '☕' },
  { id: 'txn_012', amount: 480.0, category: 'Debt Payoff', bucket: 'savings', note: 'Credit card payment', timestamp: '2026-07-11T09:00:00.000Z', emoji: '💳' },
  { id: 'txn_013', amount: 76.2, category: 'Transport', bucket: 'needs', note: 'Rideshare to airport', timestamp: '2026-07-12T06:40:00.000Z', emoji: '🚕' },
  { id: 'txn_014', amount: 310.0, category: 'Travel', bucket: 'wants', note: 'Weekend trip', timestamp: '2026-07-12T21:00:00.000Z', emoji: '🧳' },
  { id: 'txn_015', amount: 55.0, category: 'Entertainment', bucket: 'wants', note: 'Concert tickets', timestamp: '2026-07-13T19:20:00.000Z', emoji: '🎫' },
  { id: 'txn_016', amount: 98.75, category: 'Groceries', bucket: 'needs', note: 'Weekly groceries', timestamp: '2026-07-14T17:50:00.000Z', emoji: '🛒' },
  { id: 'txn_017', amount: 25.0, category: 'Dining Out', bucket: 'wants', note: 'Lunch', timestamp: '2026-07-16T12:30:00.000Z', emoji: '🍔' },
  { id: 'txn_018', amount: 15.0, category: 'Transport', bucket: 'needs', note: 'Subway', timestamp: '2026-07-18T09:00:00.000Z', emoji: '🚇' },
  { id: 'txn_019', amount: 110.0, category: 'Groceries', bucket: 'needs', note: 'Costco', timestamp: '2026-07-20T16:45:00.000Z', emoji: '🛒' },
  { id: 'txn_020', amount: 80.0, category: 'Shopping', bucket: 'wants', note: 'Jacket', timestamp: '2026-07-22T14:20:00.000Z', emoji: '🧥' },
  { id: 'txn_021', amount: 45.0, category: 'Dining Out', bucket: 'wants', note: 'Drinks', timestamp: '2026-07-25T21:30:00.000Z', emoji: '🍻' },
  { id: 'txn_022', amount: 200.0, category: 'Investing', bucket: 'savings', note: 'Stock purchase', timestamp: '2026-07-28T09:30:00.000Z', emoji: '📈' },
  { id: 'txn_023', amount: 60.0, category: 'Groceries', bucket: 'needs', note: 'Snacks', timestamp: '2026-07-30T18:10:00.000Z', emoji: '🥨' }
];
