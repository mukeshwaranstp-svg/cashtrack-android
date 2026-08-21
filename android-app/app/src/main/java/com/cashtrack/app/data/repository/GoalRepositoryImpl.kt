package com.cashtrack.app.data.repository

import com.cashtrack.app.data.local.dao.GoalDao
import com.cashtrack.app.data.mapper.toEntity
import com.cashtrack.app.data.mapper.toGoalDomains
import com.cashtrack.app.data.mapper.toGoalEntities
import com.cashtrack.app.data.remote.ApiService
import com.cashtrack.app.data.remote.dto.GoalCreateRequest
import com.cashtrack.app.domain.model.Goal
import com.cashtrack.app.domain.repository.GoalRepository
import com.cashtrack.app.util.Resource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import retrofit2.HttpException
import java.io.IOException

class GoalRepositoryImpl(
    private val api: ApiService,
    private val dao: GoalDao,
) : GoalRepository {

    override fun observeGoals(): Flow<List<Goal>> =
        dao.observeAll().map { rows -> rows.toGoalDomains() }

    override suspend fun refresh(): Resource<Unit> = safeCall("Couldn't load goals") {
        val remote = api.listGoals()
        dao.upsertAll(remote.toGoalEntities())
        Resource.Success(Unit)
    }

    override suspend fun createGoal(
        name: String,
        target: Double,
        image: String,
    ): Resource<Goal> = safeCall("Couldn't create goal") {
        val created = api.createGoal(GoalCreateRequest(name = name, target = target, image = image))
        dao.upsert(created.toEntity())
        Resource.Success(
            Goal(
                id = created.id, name = created.name, target = created.target,
                current = created.current, image = created.image,
                deadline = created.deadline, completed = created.completed,
                status = created.status,
            )
        )
    }

    override suspend fun deleteGoal(id: String): Resource<Unit> = safeCall("Couldn't delete goal") {
        api.deleteGoal(id)
        dao.deleteById(id)
        Resource.Success(Unit)
    }

    private suspend fun <T> safeCall(fallback: String, block: suspend () -> Resource<T>): Resource<T> =
        try {
            withContext(Dispatchers.IO) { block() }
        } catch (e: HttpException) {
            Resource.Error("$fallback (HTTP ${e.code()})")
        } catch (e: IOException) {
            Resource.Error("Network error — showing cached goals")
        }
}
