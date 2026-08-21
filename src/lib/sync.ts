/**
 * Cross-device sync layer.
 *
 * The app's persistent state lives in localStorage under `cashtrack_*` keys.
 * This module:
 *   1. `syncAndMigrate()` — hydrates localStorage from the cloud on startup,
 *      or pushes local data up on the first run (one-time migration).
 *   2. `flushSync()` — pushes the current localStorage state to the cloud.
 *   3. `beaconFlush()` — same, via navigator.sendBeacon for page unload.
 *
 * The cloud is authoritative after the first migration: on a conflict the
 * server bundle wins and overwrites localStorage.
 */

export interface SyncGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  image: string;
  deadline: string | null;
  priority: number;
  notes: string;
  completed: boolean;
  completionDate: string | null;
  difficulty: string;
  status: string;
}

export interface SyncHistoryEntry {
  id: string;
  goalId: string | null;
  goalName: string;
  amount: number;
  date: string;
  type: string;
  notes: string;
}

export interface SyncTodo {
  id: string;
  text: string;
  completed: boolean;
  category: string;
}

export interface SyncProfile {
  avatar: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  profilePic: string | null;
}

export interface SyncWallet {
  xp: number;
  coins: number;
  totalXpEarned: number;
  totalCoinsEarned: number;
  freezeCount: number;
  completedMissionsCount: number;
  completedStreakDates: string[];
  unlockedAchievements: string[];
}

export interface SyncCompanion {
  selected: string;
  visibility: string;
  customImage: string | null;
  customName: string | null;
  onboarded: boolean;
}

export interface SyncSettings {
  monthlyBudget: number;
  currency: string;
  theme: string;
  alertEnabled: boolean;
  alertThreshold: number;
  challengeDays: number;
}

export interface SyncMisc {
  lastExport: string | null;
  lastBudgetUpdate: string | null;
  firstExpenseLogged: boolean;
  streakStats: Record<string, unknown> | null;
}

export interface SyncBundle {
  profile: SyncProfile;
  wallet: SyncWallet;
  goals: SyncGoal[];
  savingsHistory: SyncHistoryEntry[];
  todos: SyncTodo[];
  companion: SyncCompanion;
  settings: SyncSettings;
  streak: {
    current_streak: number;
    longest_streak: number;
    last_logged_date: string | null;
    logged_today: boolean;
  };
  misc: SyncMisc;
}

const KEYS = {
  profile: "cashtrack_profile",
  profilePic: "cashtrack_profile_pic",
  xp: "cashtrack_xp",
  coins: "cashtrack_coins",
  streakStats: "cashtrack_streak_stats",
  completedStreakDates: "cashtrack_completed_streak_dates",
  unlockedAchievements: "cashtrack_unlocked_achievements",
  goals: "cashtrack_savings_goals",
  completedGoals: "cashtrack_completed_goals",
  savingsHistory: "cashtrack_savings_history",
  todos: "cashtrack_todos",
  selectedCompanion: "cashtrack_selected_companion",
  companionVisibility: "cashtrack_companion_visibility",
  customCompanionImg: "cashtrack_custom_companion_img",
  customCompanionName: "cashtrack_custom_companion_name",
  companionOnboarded: "cashtrack_companion_onboarded",
  currency: "cashtrack_currency",
  theme: "cashtrack_theme",
  alertEnabled: "cashtrack_alert_enabled",
  alertThreshold: "cashtrack_alert_threshold",
  challengeDays: "cashtrack_challenge_days",
  lastExport: "cashtrack_last_export",
  lastBudgetUpdate: "cashtrack_last_budget_update",
  firstExpenseLogged: "cashtrack_first_expense_logged",
} as const;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readInt(key: string, fallback: number): number {
  const raw = localStorage.getItem(key);
  if (raw === null || raw === "") return fallback;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? fallback : n;
}

function defaultBundle(): SyncBundle {
  return {
    profile: { avatar: "🦁", name: "", username: "", email: "", bio: "", profilePic: null },
    wallet: {
      xp: 0, coins: 0, totalXpEarned: 0, totalCoinsEarned: 0, freezeCount: 0,
      completedMissionsCount: 0, completedStreakDates: [], unlockedAchievements: [],
    },
    goals: [],
    savingsHistory: [],
    todos: [],
    companion: {
      selected: "waguri", visibility: "events", customImage: null, customName: null, onboarded: false,
    },
    settings: {
      monthlyBudget: 15000, currency: "₹", theme: "system", alertEnabled: true,
      alertThreshold: 1000, challengeDays: 7,
    },
    streak: { current_streak: 0, longest_streak: 0, last_logged_date: null, logged_today: false },
    misc: { lastExport: null, lastBudgetUpdate: null, firstExpenseLogged: false, streakStats: null },
  };
}

/** Read every cashtrack_* localStorage key into a SyncBundle. */
export function buildBundleFromLocalStorage(): SyncBundle {
  const b = defaultBundle();

  const profile = readJSON<Partial<SyncProfile>>(KEYS.profile, {});
  b.profile = {
    avatar: profile.avatar || "🦁",
    name: profile.name || "",
    username: profile.username || "",
    email: profile.email || "",
    bio: profile.bio || "",
    profilePic: localStorage.getItem(KEYS.profilePic) || null,
  };

  b.wallet.xp = readInt(KEYS.xp, 0);
  b.wallet.coins = readInt(KEYS.coins, 0);

  const stats = readJSON<Record<string, any>>(KEYS.streakStats, {});
  b.wallet.totalXpEarned = stats.total_xp_earned ?? 0;
  b.wallet.totalCoinsEarned = stats.total_coins_earned ?? 0;
  b.wallet.freezeCount = stats.freeze_count ?? 0;
  b.wallet.completedMissionsCount = stats.completed_missions_count ?? 0;
  b.misc.streakStats = stats;
  b.wallet.completedStreakDates = readJSON<string[]>(KEYS.completedStreakDates, []);
  b.wallet.unlockedAchievements = readJSON<string[]>(KEYS.unlockedAchievements, []);

  const activeGoals = readJSON<Partial<SyncGoal>[]>(KEYS.goals, []);
  const completedGoals = readJSON<Partial<SyncGoal>[]>(KEYS.completedGoals, []);
  b.goals = [
    ...activeGoals.map((g) => ({ ...g, completed: false, completionDate: null })),
    ...completedGoals.map((g) => ({
      ...g,
      completed: true,
      completionDate: (g as any).completed_at ?? g.completionDate ?? null,
    })),
  ].filter((g) => g && g.id) as SyncGoal[];

  b.savingsHistory = readJSON<SyncHistoryEntry[]>(KEYS.savingsHistory, []);
  b.todos = readJSON<SyncTodo[]>(KEYS.todos, []);

  b.companion = {
    selected: localStorage.getItem(KEYS.selectedCompanion) || "waguri",
    visibility: localStorage.getItem(KEYS.companionVisibility) || "events",
    customImage: localStorage.getItem(KEYS.customCompanionImg) || null,
    customName: localStorage.getItem(KEYS.customCompanionName) || null,
    onboarded: localStorage.getItem(KEYS.companionOnboarded) === "true",
  };

  b.settings.currency = localStorage.getItem(KEYS.currency) || "₹";
  b.settings.theme = localStorage.getItem(KEYS.theme) || "system";
  b.settings.alertEnabled = localStorage.getItem(KEYS.alertEnabled) !== "false";
  b.settings.alertThreshold = readInt(KEYS.alertThreshold, 1000);
  b.settings.challengeDays = readInt(KEYS.challengeDays, 7);

  b.misc.lastExport = localStorage.getItem(KEYS.lastExport) || null;
  b.misc.lastBudgetUpdate = localStorage.getItem(KEYS.lastBudgetUpdate) || null;
  b.misc.firstExpenseLogged = localStorage.getItem(KEYS.firstExpenseLogged) === "true";

  return b;
}

/** Write a cloud SyncBundle back into the cashtrack_* localStorage keys. */
export function applyBundleToLocalStorage(b: SyncBundle): void {
  localStorage.setItem(KEYS.profile, JSON.stringify({
    avatar: b.profile.avatar,
    name: b.profile.name,
    username: b.profile.username,
    email: b.profile.email,
    bio: b.profile.bio,
  }));
  if (b.profile.profilePic) {
    localStorage.setItem(KEYS.profilePic, b.profile.profilePic);
  } else {
    localStorage.removeItem(KEYS.profilePic);
  }

  localStorage.setItem(KEYS.xp, String(b.wallet.xp));
  localStorage.setItem(KEYS.coins, String(b.wallet.coins));

  const stats = b.misc.streakStats ?? {};
  localStorage.setItem(KEYS.streakStats, JSON.stringify({
    current_streak: stats.current_streak ?? 0,
    longest_streak: stats.longest_streak ?? 0,
    last_logged_date: stats.last_logged_date ?? null,
    freeze_count: b.wallet.freezeCount,
    completed_missions_count: b.wallet.completedMissionsCount,
    total_xp_earned: b.wallet.totalXpEarned,
    total_coins_earned: b.wallet.totalCoinsEarned,
  }));
  localStorage.setItem(KEYS.completedStreakDates, JSON.stringify(b.wallet.completedStreakDates));
  localStorage.setItem(KEYS.unlockedAchievements, JSON.stringify(b.wallet.unlockedAchievements));

  const active = b.goals.filter((g) => !g.completed);
  const completed = b.goals.filter((g) => g.completed);
  localStorage.setItem(KEYS.goals, JSON.stringify(active));
  localStorage.setItem(KEYS.completedGoals, JSON.stringify(completed));
  localStorage.setItem(KEYS.savingsHistory, JSON.stringify(b.savingsHistory));
  localStorage.setItem(KEYS.todos, JSON.stringify(b.todos));

  localStorage.setItem(KEYS.selectedCompanion, b.companion.selected);
  localStorage.setItem(KEYS.companionVisibility, b.companion.visibility);
  if (b.companion.customImage) localStorage.setItem(KEYS.customCompanionImg, b.companion.customImage);
  else localStorage.removeItem(KEYS.customCompanionImg);
  if (b.companion.customName) localStorage.setItem(KEYS.customCompanionName, b.companion.customName);
  else localStorage.removeItem(KEYS.customCompanionName);
  localStorage.setItem(KEYS.companionOnboarded, b.companion.onboarded ? "true" : "false");

  localStorage.setItem(KEYS.currency, b.settings.currency);
  localStorage.setItem(KEYS.theme, b.settings.theme);
  localStorage.setItem(KEYS.alertEnabled, b.settings.alertEnabled ? "true" : "false");
  localStorage.setItem(KEYS.alertThreshold, String(b.settings.alertThreshold));
  localStorage.setItem(KEYS.challengeDays, String(b.settings.challengeDays));

  if (b.misc.lastExport) localStorage.setItem(KEYS.lastExport, b.misc.lastExport);
  if (b.misc.lastBudgetUpdate) localStorage.setItem(KEYS.lastBudgetUpdate, b.misc.lastBudgetUpdate);
  localStorage.setItem(KEYS.firstExpenseLogged, b.misc.firstExpenseLogged ? "true" : "false");

  window.dispatchEvent(new CustomEvent("cashtrack_profile_pic_updated"));
  window.dispatchEvent(new CustomEvent("storage"));
}

/** Any persisted local data worth migrating? */
export function hasLocalData(): boolean {
  return [
    KEYS.xp, KEYS.coins, KEYS.goals, KEYS.completedGoals, KEYS.todos,
    KEYS.profile, KEYS.streakStats, KEYS.savingsHistory,
  ].some((k) => {
    const v = localStorage.getItem(k);
    return v !== null && v !== "" && v !== "0" && v !== "[]" && v !== "{}";
  });
}

/** Does the server bundle contain anything beyond factory defaults? */
export function hasCloudData(b: SyncBundle): boolean {
  return (
    b.wallet.xp > 0 || b.wallet.coins > 0 ||
    b.goals.length > 0 || b.todos.length > 0 || b.savingsHistory.length > 0 ||
    b.profile.name !== "" || b.profile.profilePic !== null ||
    b.settings.monthlyBudget !== 15000 || b.settings.currency !== "₹" ||
    b.settings.theme !== "system" || b.settings.alertEnabled !== true ||
    b.settings.alertThreshold !== 1000 || b.settings.challengeDays !== 7 ||
    b.misc.lastExport !== null || b.misc.lastBudgetUpdate !== null ||
    b.misc.firstExpenseLogged === true || b.misc.streakStats !== null
  );
}

export async function fetchSync(): Promise<SyncBundle> {
  const res = await fetch("/api/sync");
  if (!res.ok) throw new Error(`GET /api/sync failed: ${res.status}`);
  return res.json();
}

export async function pushSync(bundle: SyncBundle): Promise<SyncBundle> {
  const res = await fetch("/api/sync", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bundle),
  });
  if (!res.ok) throw new Error(`PUT /api/sync failed: ${res.status}`);
  return res.json();
}

/**
 * Startup sync + one-time localStorage -> cloud migration.
 * Cloud is authoritative once it has data.
 */
export async function syncAndMigrate(): Promise<void> {
  const cloud = await fetchSync();
  const local = hasLocalData();

  if (local && !hasCloudData(cloud)) {
    // First run on a device with existing local data: migrate it to the cloud.
    await pushSync(buildBundleFromLocalStorage());
  } else if (hasCloudData(cloud)) {
    // Cloud has data: hydrate this device from it.
    applyBundleToLocalStorage(cloud);
  }
}

/** Push current localStorage state to the cloud (best effort). */
export async function flushSync(): Promise<void> {
  try {
    await pushSync(buildBundleFromLocalStorage());
  } catch (e) {
    console.warn("CashTrack sync flush failed:", e);
  }
}

/** Page-unload flush via navigator.sendBeacon (POST). */
export function beaconFlush(): void {
  try {
    navigator.sendBeacon("/api/sync", JSON.stringify(buildBundleFromLocalStorage()));
  } catch {
    // ignore — unload flush is best effort
  }
}
