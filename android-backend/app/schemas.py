"""
Pydantic schemas (Android backend).

Domain shapes are identical to the web backend's contract (camelCase on the
wire via aliases) so one mental model covers both clients. New here: the auth
schemas — register/login/refresh/token — which are what an Android app hits
first, before any data endpoint.
"""
from __future__ import annotations

from datetime import date as Date, datetime
from email_validator import EmailNotValidError
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.categories import Category


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)
    username: str = Field(default="", max_length=100)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        # Validate rather than trust: a malformed email would otherwise become
        # an unfindable account. email-validator also rejects obvious junk.
        try:
            import email_validator

            info = email_validator.validate_email(v, check_deliverability=False)
        except EmailNotValidError as exc:
            raise ValueError(f"Invalid email: {exc}")
        return info.normalized


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: str
    email: str
    username: str
    created_at: datetime = Field(serialization_alias="createdAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class TokenPair(BaseModel):
    access_token: str = Field(serialization_alias="accessToken")
    refresh_token: str = Field(serialization_alias="refreshToken")
    token_type: str = Field(default="bearer", serialization_alias="tokenType")
    expires_in: int = Field(serialization_alias="expiresIn")


class AuthResponse(BaseModel):
    """Register/login response: tokens + user in one round trip so the app
    can go straight to a populated home screen."""
    user: UserOut
    access_token: str = Field(serialization_alias="accessToken")
    refresh_token: str = Field(serialization_alias="refreshToken")
    token_type: str = Field(default="bearer", serialization_alias="tokenType")
    expires_in: int = Field(serialization_alias="expiresIn")


# ---------------------------------------------------------------------------
# Expenses
# ---------------------------------------------------------------------------


class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0)
    category: Category
    note: str = ""
    date: Date | None = None
    timestamp: datetime | None = None
    goal_id: str | None = Field(default=None, alias="goalId")
    goal_name: str | None = Field(default=None, alias="goalName")
    goal_image: str | None = Field(default=None, alias="goalImage")
    allocations: dict[str, float] | None = None

    model_config = ConfigDict(populate_by_name=True)


class ExpenseUpdate(BaseModel):
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
    reviewed: bool | None = None
    justified: bool | None = None


class ExpenseOut(BaseModel):
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


class ExpenseCreateResponse(BaseModel):
    success: bool
    expense: ExpenseOut
    streak: "StreakOut"
    milestone_reached: bool = Field(serialization_alias="milestoneReached")
    milestone_value: int | None = Field(serialization_alias="milestoneValue")


class ExpenseWriteResponse(BaseModel):
    success: bool
    expense: ExpenseOut


# ---------------------------------------------------------------------------
# Streak / summary / settings
# ---------------------------------------------------------------------------


class StreakOut(BaseModel):
    # camelCase on the wire (the web backend emits snake_case for this one
    # object). `alias` + populate_by_name makes parsing accept BOTH casings so
    # a GET bundle can be PUT straight back — required for Room-cache sync.
    current_streak: int = Field(alias="currentStreak", serialization_alias="currentStreak")
    longest_streak: int = Field(alias="longestStreak", serialization_alias="longestStreak")
    last_logged_date: Date | None = Field(default=None, alias="lastLoggedDate", serialization_alias="lastLoggedDate")
    logged_today: bool = Field(alias="loggedToday", serialization_alias="loggedToday")

    model_config = ConfigDict(populate_by_name=True)


class StreakResetResponse(BaseModel):
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
    """Full client-state bundle exchanged by GET/PUT /api/sync."""
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


ExpenseCreateResponse.model_rebuild()
