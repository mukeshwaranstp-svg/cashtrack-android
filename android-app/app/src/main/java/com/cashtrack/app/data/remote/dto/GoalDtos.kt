package com.cashtrack.app.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class GoalDto(
    val id: String,
    val name: String,
    val target: Double,
    val current: Double = 0.0,
    val image: String = "🎯",
    val deadline: String? = null,
    val priority: Int = 1,
    val notes: String = "",
    val completed: Boolean = false,
    @SerialName("completionDate") val completionDate: String? = null,
    val difficulty: String = "Common",
    val status: String = "On Track",
)

@Serializable
data class GoalCreateRequest(
    val name: String,
    val target: Double,
    val current: Double = 0.0,
    val image: String = "🎯",
    val deadline: String? = null,
    val priority: Int = 1,
    val notes: String = "",
    val difficulty: String = "Common",
    val status: String = "On Track",
)

@Serializable
data class SettingsDto(
    @SerialName("monthlyBudget") val monthlyBudget: Double,
    val currency: String = "₹",
    val theme: String = "system",
    @SerialName("alertEnabled") val alertEnabled: Boolean = true,
    @SerialName("alertThreshold") val alertThreshold: Double = 1000.0,
    @SerialName("challengeDays") val challengeDays: Int = 7,
)
