package com.cashtrack.app.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ExpenseCreateRequest(
    val amount: Double,
    val category: String,
    val note: String = "",
    /** ISO local date "yyyy-MM-dd"; omit to let the server use today. */
    val date: String? = null,
    @SerialName("goalId") val goalId: String? = null,
    @SerialName("goalName") val goalName: String? = null,
    @SerialName("goalImage") val goalImage: String? = null,
)

@Serializable
data class ExpenseDto(
    val id: String,
    val amount: Double,
    val category: String,
    /** Needs / Wants / Savings — assigned server-side from the category. */
    val bucket: String,
    val note: String,
    /** "yyyy-MM-dd" */
    val date: String,
    /** ISO-8601 timestamp */
    val timestamp: String,
    val reviewed: Boolean,
    val justified: Boolean,
    @SerialName("goalId") val goalId: String? = null,
    @SerialName("goalName") val goalName: String? = null,
    @SerialName("goalImage") val goalImage: String? = null,
)

@Serializable
data class StreakDto(
    @SerialName("currentStreak") val currentStreak: Int,
    @SerialName("longestStreak") val longestStreak: Int,
    @SerialName("lastLoggedDate") val lastLoggedDate: String?,
    @SerialName("loggedToday") val loggedToday: Boolean,
)

@Serializable
data class ExpenseReviewUpdate(
    val reviewed: Boolean? = null,
    val justified: Boolean? = null,
)

@Serializable
data class ExpenseWriteResponse(
    val success: Boolean,
    val expense: ExpenseDto,
)

@Serializable
data class ExpenseCreateResponse(
    val success: Boolean,
    val expense: ExpenseDto,
    val streak: StreakDto,
    /** True when the streak hit 3/7/14/30/50/100 — show the celebration. */
    @SerialName("milestoneReached") val milestoneReached: Boolean,
    @SerialName("milestoneValue") val milestoneValue: Int? = null,
)

@Serializable
data class SimpleResponse(
    val success: Boolean,
)
