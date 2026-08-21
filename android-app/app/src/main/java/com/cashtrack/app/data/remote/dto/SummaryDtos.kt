package com.cashtrack.app.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** GET /api/summary — feeds the whole dashboard. */
@Serializable
data class SummaryDto(
    @SerialName("totalSpend") val totalSpend: Double,
    @SerialName("monthlyBudget") val monthlyBudget: Double,
    @SerialName("dailyThreshold") val dailyThreshold: Double,
    @SerialName("bucketSummary") val bucketSummary: List<BucketSummaryDto>,
    @SerialName("categorySummary") val categorySummary: List<CategorySummaryDto>,
    val heatmap: List<HeatmapDayDto>,
    @SerialName("weeklyTrend") val weeklyTrend: List<WeeklyTrendDayDto>,
    @SerialName("recentTransactions") val recentTransactions: List<ExpenseDto>,
    @SerialName("lastMonthSpend") val lastMonthSpend: Double,
    val streak: StreakDto,
)

@Serializable
data class BucketSummaryDto(
    val bucket: String,
    val amount: Double,
    @SerialName("targetPercentage") val targetPercentage: Double,
    @SerialName("relativePercentage") val relativePercentage: Double,
    @SerialName("limitPercentage") val limitPercentage: Double,
    @SerialName("isOverBudget") val isOverBudget: Boolean,
    @SerialName("targetAmount") val targetAmount: Double,
)

@Serializable
data class CategorySummaryDto(
    val category: String,
    val amount: Double,
    val bucket: String,
    val percentage: Double,
)

@Serializable
data class HeatmapDayDto(
    val date: String,
    val amount: Double,
    @SerialName("isOverBudget") val isOverBudget: Boolean,
)

@Serializable
data class WeeklyTrendDayDto(
    val date: String,
    val amount: Double,
    val label: String,
    val needs: Double = 0.0,
    val wants: Double = 0.0,
    val savings: Double = 0.0,
)
