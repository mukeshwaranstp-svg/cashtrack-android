package com.cashtrack.app.domain.model

/**
 * Domain models — what the UI layer sees. Deliberately plain Kotlin: no
 * Retrofit/Room annotations leak upward, so swapping the network or database
 * library never touches a single ViewModel or Composable.
 */
data class User(
    val id: String,
    val email: String,
    val username: String,
)

data class Streak(
    val currentStreak: Int,
    val longestStreak: Int,
    val lastLoggedDate: String?,
    val loggedToday: Boolean,
)

data class Expense(
    val id: String,
    val amount: Double,
    val category: String,
    val bucket: String,
    val note: String,
    val date: String,
    val timestamp: String,
    val reviewed: Boolean,
    val justified: Boolean,
    val goalId: String? = null,
    val goalName: String? = null,
)

data class BucketSummary(
    val bucket: String,
    val amount: Double,
    val targetPercentage: Double,
    val limitPercentage: Double,
    val isOverBudget: Boolean,
    val targetAmount: Double,
)

data class CategorySummary(
    val category: String,
    val amount: Double,
    val bucket: String,
    val percentage: Double,
)

data class WeeklyTrendDay(
    val date: String,
    val label: String,
    val amount: Double,
    val needs: Double,
    val wants: Double,
    val savings: Double,
)

data class Summary(
    val totalSpend: Double,
    val monthlyBudget: Double,
    val dailyThreshold: Double,
    val buckets: List<BucketSummary>,
    val categories: List<CategorySummary>,
    val weeklyTrend: List<WeeklyTrendDay>,
    val recentTransactions: List<Expense>,
    val lastMonthSpend: Double,
    val streak: Streak,
)

/** Result of logging an expense — drives the streak celebration UI. */
data class LogExpenseResult(
    val expense: Expense,
    val streak: Streak,
    val milestoneReached: Boolean,
    val milestoneValue: Int?,
)

data class Goal(
    val id: String,
    val name: String,
    val target: Double,
    val current: Double,
    val image: String,
    val deadline: String?,
    val completed: Boolean,
    val status: String,
) {
    /** 0..1 progress toward target — computed once here, not in every screen. */
    val progress: Float get() = if (target > 0) (current / target).toFloat().coerceIn(0f, 1f) else 0f
}
