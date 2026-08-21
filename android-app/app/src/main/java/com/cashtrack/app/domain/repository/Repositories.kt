package com.cashtrack.app.domain.repository

import com.cashtrack.app.domain.model.Expense
import com.cashtrack.app.domain.model.Goal
import com.cashtrack.app.domain.model.LogExpenseResult
import com.cashtrack.app.domain.model.Summary
import com.cashtrack.app.domain.model.User
import com.cashtrack.app.util.Resource
import kotlinx.coroutines.flow.Flow

/**
 * Contracts the UI codes against. ViewModels depend on these interfaces, not
 * on Retrofit — which is what makes repositories swappable and fakes possible.
 */
interface AuthRepository {
    val authState: Flow<Boolean> // true = logged in

    suspend fun register(email: String, password: String, username: String): Resource<User>
    suspend fun login(email: String, password: String): Resource<User>
    suspend fun logout()
}

interface ExpenseRepository {
    /** Room cache stream — emits immediately, then on every upsert. */
    fun observeExpenses(): Flow<List<Expense>>

    suspend fun refresh(): Resource<Unit>
    suspend fun logExpense(
        amount: Double,
        category: String,
        note: String,
        date: String?,
    ): Resource<LogExpenseResult>

    suspend fun deleteExpense(id: String): Resource<Unit>
    suspend fun summary(): Resource<Summary>
}

interface GoalRepository {
    fun observeGoals(): Flow<List<Goal>>
    suspend fun refresh(): Resource<Unit>
    suspend fun createGoal(name: String, target: Double, image: String): Resource<Goal>
    suspend fun deleteGoal(id: String): Resource<Unit>
}
