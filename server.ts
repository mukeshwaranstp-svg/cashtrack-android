import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { getBucketForCategory } from "./src/constants/categories";

interface Expense {
  id: string;
  amount: number;
  category: string;
  bucket: 'Needs' | 'Wants' | 'Savings';
  note: string;
  timestamp: string; // ISO string
  date: string; // 'YYYY-MM-DD'
  reviewed: boolean;
  justified: boolean;
  goalId?: string;
  goalName?: string;
  goalImage?: string;
  allocations?: Record<string, number>;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
  last_logged_date: string | null; // 'YYYY-MM-DD'
}

interface Settings {
  monthlyBudget: number;
}

interface DB {
  expenses: Expense[];
  streak: Streak;
  settings: Settings;
}

const app = express();
app.use(express.json());

const DB_FILE = path.join(process.cwd(), "data.json");

// Read and write helpers for JSON file DB
function readDB(): DB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Error reading database file, resetting...", e);
  }
  const initialDB: DB = {
    expenses: [],
    streak: {
      current_streak: 0,
      longest_streak: 0,
      last_logged_date: null
    },
    settings: {
      monthlyBudget: 15000
    }
  };
  writeDB(initialDB);
  return initialDB;
}

function writeDB(data: DB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing to database file", e);
  }
}

// Helpers for date calculations
function getDaysDiff(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + "T00:00:00Z");
  const d2 = new Date(dateStr2 + "T00:00:00Z");
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// Lazy streak break check
function checkAndUpdateStreakBreak(db: DB, today: string): boolean {
  if (!db.streak.last_logged_date) return false;
  const diff = getDaysDiff(today, db.streak.last_logged_date);
  // If the user's last log was before yesterday, and today is after last_logged_date
  if (diff > 1 && today > db.streak.last_logged_date) {
    db.streak.current_streak = 0;
    return true;
  }
  return false;
}

// ==================== API ENDPOINTS ====================

// 1. Get streak info
app.get("/api/streak", (req, res) => {
  const today = (req.query.today as string) || new Date().toISOString().split("T")[0];
  const db = readDB();
  const changed = checkAndUpdateStreakBreak(db, today);
  if (changed) {
    writeDB(db);
  }
  
  const loggedToday = db.streak.last_logged_date === today;
  res.json({
    current_streak: db.streak.current_streak,
    longest_streak: db.streak.longest_streak,
    last_logged_date: db.streak.last_logged_date,
    logged_today: loggedToday
  });
});

// 2. Post custom expense and update streak
app.post("/api/expense", (req, res) => {
  const { amount, category, note, date, timestamp, goalId, goalName, goalImage, allocations } = req.body;
  if (!amount || isNaN(Number(amount)) || !category) {
    res.status(400).json({ error: "Invalid amount or category" });
    return;
  }

  const db = readDB();
  const expenseDate = date || new Date().toISOString().split("T")[0];
  const expenseTimestamp = timestamp || new Date().toISOString();
  const bucket = getBucketForCategory(category);

  // Streak calculation
  let milestoneReached = false;
  let streakIncreased = false;

  // Let's check and apply streak breaks first before analyzing new log
  checkAndUpdateStreakBreak(db, expenseDate);

  if (db.streak.last_logged_date === null) {
    db.streak.current_streak = 1;
    db.streak.last_logged_date = expenseDate;
    streakIncreased = true;
  } else if (db.streak.last_logged_date === expenseDate) {
    // Already logged today, streak remains unchanged
  } else {
    const diff = getDaysDiff(expenseDate, db.streak.last_logged_date);
    if (diff === 1) {
      db.streak.current_streak += 1;
      db.streak.last_logged_date = expenseDate;
      streakIncreased = true;
    } else if (expenseDate > db.streak.last_logged_date) {
      // Streak was broken, set to 1
      db.streak.current_streak = 1;
      db.streak.last_logged_date = expenseDate;
      streakIncreased = true;
    }
    // If expenseDate is in the past, we don't advance the streak forward
  }

  if (db.streak.current_streak > db.streak.longest_streak) {
    db.streak.longest_streak = db.streak.current_streak;
  }

  // Check milestones
  if (streakIncreased) {
    const milestones = [3, 7, 14, 30, 50, 100];
    if (milestones.includes(db.streak.current_streak)) {
      milestoneReached = true;
    }
  }

  // Add the new expense
  const newExpense: Expense = {
    id: Math.random().toString(36).substring(2, 11),
    amount: parseFloat(amount),
    category,
    bucket,
    note: note || "",
    timestamp: expenseTimestamp,
    date: expenseDate,
    reviewed: false,
    justified: false,
    goalId,
    goalName,
    goalImage,
    allocations
  };

  db.expenses.push(newExpense);
  writeDB(db);

  res.json({
    success: true,
    expense: newExpense,
    streak: {
      current_streak: db.streak.current_streak,
      longest_streak: db.streak.longest_streak,
      last_logged_date: db.streak.last_logged_date,
      logged_today: db.streak.last_logged_date === expenseDate
    },
    milestoneReached,
    milestoneValue: db.streak.current_streak
  });
});

// 3. Get all expenses
app.get("/api/expenses", (req, res) => {
  const db = readDB();
  res.json(db.expenses);
});

// 4. Delete expense
app.delete("/api/expense/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.expenses.findIndex(e => e.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  db.expenses.splice(index, 1);
  writeDB(db);
  res.json({ success: true });
});

// 4b. Edit expense
app.put("/api/expense/:id", (req, res) => {
  const { id } = req.params;
  const { amount, category, note, date, timestamp, goalId, goalName, goalImage, allocations } = req.body;
  const db = readDB();
  const expense = db.expenses.find(e => e.id === id);
  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  if (amount !== undefined) expense.amount = parseFloat(amount);
  if (category !== undefined) {
    expense.category = category;
    expense.bucket = getBucketForCategory(category);
  }
  if (note !== undefined) expense.note = note || "";
  if (date !== undefined) expense.date = date;
  if (timestamp !== undefined) expense.timestamp = timestamp;
  
  expense.goalId = goalId;
  expense.goalName = goalName;
  expense.goalImage = goalImage;
  expense.allocations = allocations;

  writeDB(db);
  res.json({ success: true, expense });
});

// 5. Update justification/review
app.patch("/api/expense/:id", (req, res) => {
  const { id } = req.params;
  const { justified, reviewed } = req.body;
  const db = readDB();
  const expense = db.expenses.find(e => e.id === id);
  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  if (justified !== undefined) expense.justified = !!justified;
  if (reviewed !== undefined) expense.reviewed = !!reviewed;
  writeDB(db);
  res.json({ success: true, expense });
});

// 6. Reset streak
app.post("/api/streak/reset", (req, res) => {
  const db = readDB();
  db.streak.current_streak = 0;
  db.streak.longest_streak = 0;
  db.streak.last_logged_date = null;
  writeDB(db);
  res.json({ success: true, streak: db.streak });
});

// 7. Get Summary & Analysis stats
app.get("/api/summary", (req, res) => {
  const today = (req.query.today as string) || new Date().toISOString().split("T")[0];
  const db = readDB();
  checkAndUpdateStreakBreak(db, today);
  writeDB(db);

  const budgetLimit = db.settings.monthlyBudget;
  const yearMonth = today.substring(0, 7); // 'YYYY-MM'

  // Filter current month expenses
  const monthlyExpenses = db.expenses.filter(e => e.date.startsWith(yearMonth));
  const totalSpend = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by bucket
  const bucketTotals = {
    Needs: 0,
    Wants: 0,
    Savings: 0
  };
  monthlyExpenses.forEach(e => {
    if (bucketTotals[e.bucket] !== undefined) {
      bucketTotals[e.bucket] += e.amount;
    }
  });

  // Calculate percentages and target limits
  const targets = { Needs: 0.70, Wants: 0.20, Savings: 0.10 };
  const targetAmounts = {
    Needs: budgetLimit * targets.Needs,
    Wants: budgetLimit * targets.Wants,
    Savings: budgetLimit * targets.Savings
  };

  const bucketSummary = Object.keys(bucketTotals).map(b => {
    const bucket = b as 'Needs' | 'Wants' | 'Savings';
    const amount = bucketTotals[bucket];
    const targetPercentage = targets[bucket] * 100;
    // relative to total actual spend
    const relativePercentage = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
    // relative to budget limit
    const limitPercentage = (amount / targetAmounts[bucket]) * 100;
    const isOverBudget = amount > targetAmounts[bucket];

    return {
      bucket,
      amount,
      targetPercentage,
      relativePercentage,
      limitPercentage,
      isOverBudget,
      targetAmount: targetAmounts[bucket]
    };
  });

  // Group by category for current month breakdown
  const categoryTotals: { [key: string]: number } = {};
  monthlyExpenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  // Category summary array
  const categoriesList = [
    'Food – Essential', 'Travel', 'Essentials',
    'Food – Convenience', 'Entertainment', 'Impulse',
    'Savings/Investment'
  ];
  const categorySummary = categoriesList.map(cat => {
    const amount = categoryTotals[cat] || 0;
    const bucket = getBucketForCategory(cat);
    const percentage = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
    return { category: cat, amount, bucket, percentage };
  });

  // Heatmap Calendar details for current month
  // Daily average limit: budgetLimit / daysInMonth (let's assume 30 for simplicity)
  const daysInMonth = 30;
  const dailyThreshold = budgetLimit / daysInMonth;

  const dateMap: { [date: string]: number } = {};
  monthlyExpenses.forEach(e => {
    dateMap[e.date] = (dateMap[e.date] || 0) + e.amount;
  });

  const heatmap = Object.keys(dateMap).map(date => {
    const amount = dateMap[date];
    return {
      date,
      amount,
      isOverBudget: amount > dailyThreshold
    };
  });

  // Recent 15 transactions
  const recentTransactions = [...db.expenses]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 15);

  // Weekly Trend: Last 7 days ending with `today`
  const weeklyTrend: { date: string; amount: number; label: string }[] = [];
  const todayDate = new Date(today + "T00:00:00");
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    // Sum for this date
    const dayTotal = db.expenses
      .filter(e => e.date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    weeklyTrend.push({
      date: dateStr,
      amount: dayTotal,
      label: weekdays[d.getDay()]
    });
  }

  res.json({
    totalSpend,
    monthlyBudget: budgetLimit,
    dailyThreshold,
    bucketSummary,
    categorySummary,
    heatmap,
    weeklyTrend,
    recentTransactions,
    streak: {
      current_streak: db.streak.current_streak,
      longest_streak: db.streak.longest_streak,
      last_logged_date: db.streak.last_logged_date,
      logged_today: db.streak.last_logged_date === today
    }
  });
});

// 8. Update settings
app.post("/api/settings", (req, res) => {
  const { monthlyBudget } = req.body;
  if (!monthlyBudget || isNaN(Number(monthlyBudget))) {
    res.status(400).json({ error: "Invalid monthly budget" });
    return;
  }
  const db = readDB();
  db.settings.monthlyBudget = parseFloat(monthlyBudget);
  writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// =======================================================

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
