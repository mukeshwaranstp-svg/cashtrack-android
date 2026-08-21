package com.cashtrack.app.data.repository

import com.cashtrack.app.data.local.dao.ExpenseDao
import com.cashtrack.app.data.mapper.toDomain
import com.cashtrack.app.data.mapper.toEntities
import com.cashtrack.app.data.mapper.toEntity
import com.cashtrack.app.data.remote.ApiService
import com.cashtrack.app.data.remote.dto.ExpenseCreateRequest
import com.cashtrack.app.domain.model.Expense
import com.cashtrack.app.domain.model.LogExpenseResult
import com.cashtrack.app.domain.model.Summary
import com.cashtrack.app.domain.repository.ExpenseRepository
import com.cashtrack.app.util.Resource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import retrofit2.HttpException
import java.io.IOException

class ExpenseRepositoryImpl(
    private val api: ApiService,
    private val dao: ExpenseDao,
) : ExpenseRepository {

    override fun observeExpenses(): Flow<List<Expense>> =
        dao.observeAll().map { rows -> rows.map { it.toDomain() } }

    override suspend fun refresh(): Resource<Unit> = safeCall("Couldn't load expenses") {
        val remote = api.listExpenses()
        dao.upsertAll(remote.toEntities())
        Resource.Success(Unit)
    }

    override suspend fun logExpense(
        amount: Double,
        category: String,
        note: String,
        date: String?,
    ): Resource<LogExpenseResult> = safeCall("Couldn't save expense") {
        val response = api.createExpense(
            ExpenseCreateRequest(amount = amount, category = category, note = note, date = date)
        )
        // Cache the server's copy (it owns ids and the streak math).
        dao.upsert(response.expense.toEntity())
        Resource.Success(
            LogExpenseResult(
                expense = response.expense.toEntity().toDomain(),
                streak = response.streak.let {
                    com.cashtrack.app.domain.model.Streak(
                        currentStreak = it.currentStreak,
                        longestStreak = it.longestStreak,
                        lastLoggedDate = it.lastLoggedDate,
                        loggedToday = it.loggedToday,
                    )
                },
                milestoneReached = response.milestoneReached,
                milestoneValue = response.milestoneValue,
            )
        )
    }

    override suspend fun deleteExpense(id: String): Resource<Unit> = safeCall("Couldn't delete") {
        api.deleteExpense(id)
        dao.deleteById(id) // optimistic local removal; server already confirmed
        Resource.Success(Unit)
    }

    override suspend fun summary(): Resource<Summary> = safeCall("Couldn't load summary") {
        val s = api.summary()
        // Keep the cache warm with the transactions that came along.
        dao.upsertAll(s.recentTransactions.toEntities())
        Resource.Success(
            Summary(
                totalSpend = s.totalSpend,
                monthlyBudget = s.monthlyBudget,
                dailyThreshold = s.dailyThreshold,
                buckets = s.bucketSummary.map {
                    com.cashtrack.app.domain.model.BucketSummary(
                        bucket = it.bucket,
                        amount = it.amount,
                        targetPercentage = it.targetPercentage,
                        limitPercentage = it.limitPercentage,
                        isOverBudget = it.isOverBudget,
                        targetAmount = it.targetAmount,
                    )
                },
                categories = s.categorySummary.map {
                    com.cashtrack.app.domain.model.CategorySummary(
                        category = it.category,
                        amount = it.amount,
                        bucket = it.bucket,
                        percentage = it.percentage,
                    )
                },
                weeklyTrend = s.weeklyTrend.map {
                    com.cashtrack.app.domain.model.WeeklyTrendDay(
                        date = it.date, label = it.label, amount = it.amount,
                        needs = it.needs, wants = it.wants, savings = it.savings,
                    )
                },
                recentTransactions = s.recentTransactions.map { it.toEntity().toDomain() },
                lastMonthSpend = s.lastMonthSpend,
                streak = com.cashtrack.app.domain.model.Streak(
                    currentStreak = s.streak.currentStreak,
                    longestStreak = s.streak.longestStreak,
                    lastLoggedDate = s.streak.lastLoggedDate,
                    loggedToday = s.streak.loggedToday,
                ),
            )
        )
    }

    private inline fun <T> safeCall(fallback: String, block: () -> Resource<T>): Resource<T> =
        try {
            withContext(Dispatchers.IO) { block() }
        } catch (e: HttpException) {
            Resource.Error("$fallback (HTTP ${e.code()})")
        } catch (e: IOException) {
            Resource.Error("Network error — showing cached data")
        }
}
