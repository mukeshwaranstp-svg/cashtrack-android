"""
Pydantic schemas — the API contract the frontend expects.

Field names are deliberately snake_case in Python but serialized/parsed as
camelCase via aliases, matching src/types.ts and the reference server.ts.
Pydantic v2 aliases:
  - `alias` + populate_by_name -> accepts camelCase from the frontend
  - `serialization_alias`      -> emits camelCase back to the frontend
"""
from __future__ import annotations

from datetime import date as Date, datetime
from pydantic import BaseModel, ConfigDict, Field
from app.categories import Category

class ExpenseCreate(BaseModel):
    """Body of POST /api/expense — exactly what AddExpenseModal sends."""
    amount: float = Field(gt=0, description="Must be positive")
    category: Category
    note: str = ""
    date: Date | None = None                  # defaults to server's today
    timestamp: datetime | None = None        # defaults to server's now
    goal_id: str | None = Field(default=None, alias="goalId")
    goal_name: str | None = Field(default=None, alias="goalName")
    goal_image: str | None = Field(default=None, alias="goalImage")
    allocations: dict[str, float] | None = None

    model_config = ConfigDict(populate_by_name=True)


class ExpenseUpdate(BaseModel):
    """Body of PUT /api/expense/{id}."""
    amount: float | None = Field(default=None, gt=0)
    category: Category | None = None
    note: str | None = None
    date: Date | None = None
    timestamp: datetime | None = None
    goal_id: str | None = Field(default=None, alias="goalId")
    goal_name: str | None = Field(default=None, alias="goalName")
    goal_image: str | None = Field(default=None, alias="goalImage")
    allocations: dict[str, float] | None = None

    model_config = ConfigDict(populate_by_name=True)


class ExpenseReviewUpdate(BaseModel):
    """Body of PATCH /api/expense/{id} — review/justify flags."""
    reviewed: bool | None = None
    justified: bool | None = None


class ExpenseOut(BaseModel):
    """The Expense shape the frontend reads (src/types.ts)."""
    id: str
    amount: float
    category: str
    bucket: str
    note: str
    date: Date
    timestamp: datetime
    reviewed: bool
    justified: bool
    goal_id: str | None = Field(default=None, serialization_alias="goalId")
    goal_name: str | None = Field(default=None, serialization_alias="goalName")
    goal_image: str | None = Field(default=None, serialization_alias="goalImage")
    allocations: dict[str, float] | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class StreakOut(BaseModel):
    """The Streak shape the frontend reads (src/types.ts)."""
    current_streak: int
    longest_streak: int
    last_logged_date: Date | None
    logged_today: bool


class ExpenseCreateResponse(BaseModel):
    """Response of POST /api/expense — what AddExpenseModal's onSuccess needs."""
    success: bool
    expense: ExpenseOut
    streak: StreakOut
    milestone_reached: bool = Field(serialization_alias="milestoneReached")
    milestone_value: int | None = Field(serialization_alias="milestoneValue")


class ExpenseWriteResponse(BaseModel):
    """Response of PUT /api/expense/{id} and PATCH /api/expense/{id}."""
    success: bool
    expense: ExpenseOut


class StreakResetResponse(BaseModel):
    """Response of POST /api/streak/reset."""
    success: bool
    streak: StreakOut


class BucketSummaryOut(BaseModel):
    bucket: str
    amount: float
    target_percentage: float = Field(serialization_alias="targetPercentage")
    relative_percentage: float = Field(serialization_alias="relativePercentage")
    limit_percentage: float = Field(serialization_alias="limitPercentage")
    is_over_budget: bool = Field(serialization_alias="isOverBudget")
    target_amount: float = Field(serialization_alias="targetAmount")


class CategorySummaryOut(BaseModel):
    category: str
    amount: float
    bucket: str
    percentage: float


class HeatmapDayOut(BaseModel):
    date: Date
    amount: float
    is_over_budget: bool = Field(serialization_alias="isOverBudget")


class WeeklyTrendDayOut(BaseModel):
    date: Date
    amount: float
    label: str
    needs: float = 0
    wants: float = 0
    savings: float = 0


class SummaryOut(BaseModel):
    """Response of GET /api/summary — feeds the whole dashboard/analysis."""
    total_spend: float = Field(serialization_alias="totalSpend")
    monthly_budget: float = Field(serialization_alias="monthlyBudget")
    daily_threshold: float = Field(serialization_alias="dailyThreshold")
    bucket_summary: list[BucketSummaryOut] = Field(serialization_alias="bucketSummary")
    category_summary: list[CategorySummaryOut] = Field(serialization_alias="categorySummary")
    heatmap: list[HeatmapDayOut]
    weekly_trend: list[WeeklyTrendDayOut] = Field(serialization_alias="weeklyTrend")
    recent_transactions: list[ExpenseOut] = Field(serialization_alias="recentTransactions")
    last_month_spend: float = Field(default=0.0, serialization_alias="lastMonthSpend")
    streak: StreakOut


class SettingsOut(BaseModel):
    monthly_budget: float = Field(alias="monthlyBudget", serialization_alias="monthlyBudget")
    currency: str = "₹"
    theme: str = "system"
    alert_enabled: bool = Field(default=True, alias="alertEnabled", serialization_alias="alertEnabled")
    alert_threshold: float = Field(default=1000.0, alias="alertThreshold", serialization_alias="alertThreshold")
    challenge_days: int = Field(default=7, alias="challengeDays", serialization_alias="challengeDays")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SettingsUpdate(BaseModel):
    monthly_budget: float | None = Field(default=None, gt=0, alias="monthlyBudget")
    currency: str | None = Field(default=None, max_length=10)
    theme: str | None = Field(default=None, max_length=10)
    alert_enabled: bool | None = Field(default=None, alias="alertEnabled")
    alert_threshold: float | None = Field(default=None, gt=0, alias="alertThreshold")
    challenge_days: int | None = Field(default=None, ge=1, le=30, alias="challengeDays")

    model_config = ConfigDict(populate_by_name=True)


class SettingsResponse(BaseModel):
    success: bool
    settings: SettingsOut


# ---------------------------------------------------------------------------
# Sync-layer schemas: wallet, profile, goals, history, todos, companion, bundle
# ---------------------------------------------------------------------------


class WalletOut(BaseModel):
    """XP/coins wallet + progression (mirrors cashtrack_streak_stats)."""
    xp: int = 0
    coins: int = 0
    total_xp_earned: int = Field(default=0, alias="totalXpEarned", serialization_alias="totalXpEarned")
    total_coins_earned: int = Field(default=0, alias="totalCoinsEarned", serialization_alias="totalCoinsEarned")
    freeze_count: int = Field(default=0, alias="freezeCount", serialization_alias="freezeCount")
    completed_missions_count: int = Field(default=0, alias="completedMissionsCount", serialization_alias="completedMissionsCount")
    completed_streak_dates: list[str] = Field(default_factory=list, alias="completedStreakDates", serialization_alias="completedStreakDates")
    unlocked_achievements: list[str] = Field(default_factory=list, alias="unlockedAchievements", serialization_alias="unlockedAchievements")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ProfileOut(BaseModel):
    avatar: str = "🦁"
    name: str = ""
    username: str = ""
    email: str = ""
    bio: str = ""
    profile_pic: str | None = Field(default=None, alias="profilePic", serialization_alias="profilePic")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class CompanionOut(BaseModel):
    selected: str = "waguri"
    visibility: str = "events"
    custom_image: str | None = Field(default=None, alias="customImage", serialization_alias="customImage")
    custom_name: str | None = Field(default=None, alias="customName", serialization_alias="customName")
    onboarded: bool = False

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SavingsGoalOut(BaseModel):
    """Exact frontend SavingsGoal shape (SavingsHub.tsx)."""
    id: str
    name: str
    target: float
    current: float = 0.0
    image: str = "🎯"
    deadline: Date | None = None
    priority: int = 1
    notes: str = ""
    completed: bool = False
    completion_date: Date | None = Field(default=None, alias="completionDate", serialization_alias="completionDate")
    difficulty: str = "Common"
    status: str = "On Track"

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SavingsGoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    target: float = Field(gt=0)
    current: float = Field(default=0.0, ge=0)
    image: str = "🎯"
    deadline: Date | None = None
    priority: int = 1
    notes: str = ""
    difficulty: str = "Common"
    status: str = "On Track"


class SavingsGoalUpdate(BaseModel):
    name: str | None = None
    target: float | None = Field(default=None, gt=0)
    current: float | None = Field(default=None, ge=0)
    image: str | None = None
    deadline: Date | None = None
    priority: int | None = None
    notes: str | None = None
    completed: bool | None = None
    completion_date: Date | None = Field(default=None, alias="completionDate")
    difficulty: str | None = None
    status: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class SavingsHistoryOut(BaseModel):
    id: str
    goal_id: str | None = Field(default=None, alias="goalId", serialization_alias="goalId")
    goal_name: str = Field(alias="goalName", serialization_alias="goalName")
    amount: float
    date: Date
    type: str = "deposit"
    notes: str = ""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SavingsHistoryCreate(BaseModel):
    goal_id: str | None = Field(default=None, alias="goalId")
    goal_name: str = Field(min_length=1, max_length=100, alias="goalName")
    amount: float = Field(gt=0)
    date: Date
    type: str = "deposit"
    notes: str = ""

    model_config = ConfigDict(populate_by_name=True)


class TodoOut(BaseModel):
    id: str
    text: str
    completed: bool = False
    category: str = ""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class TodoCreate(BaseModel):
    text: str = Field(min_length=1, max_length=300)
    completed: bool = False
    category: str = ""


class TodoUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1, max_length=300)
    completed: bool | None = None
    category: str | None = None


class MiscOut(BaseModel):
    last_export: str | None = Field(default=None, alias="lastExport", serialization_alias="lastExport")
    last_budget_update: str | None = Field(default=None, alias="lastBudgetUpdate", serialization_alias="lastBudgetUpdate")
    first_expense_logged: bool = Field(default=False, alias="firstExpenseLogged", serialization_alias="firstExpenseLogged")
    streak_stats: dict | None = Field(default=None, alias="streakStats", serialization_alias="streakStats")

    model_config = ConfigDict(populate_by_name=True)


class SyncBundle(BaseModel):
    """The full client-state bundle exchanged by GET/PUT /api/sync."""
    profile: ProfileOut
    wallet: WalletOut
    goals: list[SavingsGoalOut] = []
    savings_history: list[SavingsHistoryOut] = Field(default_factory=list, alias="savingsHistory", serialization_alias="savingsHistory")
    todos: list[TodoOut] = []
    companion: CompanionOut
    settings: SettingsOut
    streak: StreakOut
    misc: MiscOut

    model_config = ConfigDict(populate_by_name=True)
