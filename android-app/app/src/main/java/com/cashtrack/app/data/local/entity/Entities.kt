package com.cashtrack.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Room entities mirror the API DTOs (same field names) — the app is
 * offline-first for reads: network responses are upserted here, and the UI
 * observes these tables via Flow so screens render instantly from cache and
 * update when the network responds.
 */
@Entity(tableName = "expenses")
data class ExpenseEntity(
    @PrimaryKey val id: String,
    val amount: Double,
    val category: String,
    val bucket: String,
    val note: String,
    /** "yyyy-MM-dd" */
    val date: String,
    /** ISO-8601 */
    val timestamp: String,
    val reviewed: Boolean,
    val justified: Boolean,
    val goalId: String?,
    val goalName: String?,
    val goalImage: String?,
)

@Entity(tableName = "goals")
data class GoalEntity(
    @PrimaryKey val id: String,
    val name: String,
    val target: Double,
    val current: Double,
    val image: String,
    val deadline: String?,
    val priority: Int,
    val notes: String,
    val completed: Boolean,
    val completionDate: String?,
    val difficulty: String,
    val status: String,
)
