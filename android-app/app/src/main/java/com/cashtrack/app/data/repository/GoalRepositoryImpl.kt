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

    override suspend fun refresh(): Resource<Unit> = try {
        withContext(Dispatchers.IO) {
            val remote = api.listGoals()
            dao.upsertAll(remote.toGoalEntities())
        }
        Resource.Success(Unit)
    } catch (e: HttpException) {
        Resource.Error("Couldn't load goals (HTTP ${e.code()})")
    } catch (e: IOException) {
        Resource.Error("Network error — showing cached goals")
    }

    override suspend fun createGoal(
        name: String,
        target: Double,
        image: String,
    ): Resource<Goal> = try {
        val created = withContext(Dispatchers.IO) {
            api.createGoal(GoalCreateRequest(name = name, target = target, image = image))
        }
        dao.upsert(created.toEntity())
        Resource.Success(created.toEntity().let { entity ->
            Goal(
                id = entity.id, name = entity.name, target = entity.target,
                current = entity.current, image = entity.image,
                deadline = entity.deadline, completed = entity.completed,
                status = entity.status,
            )
        })
    } catch (e: HttpException) {
        Resource.Error("Couldn't create goal (HTTP ${e.code()})")
    } catch (e: IOException) {
        Resource.Error("Network error — check your connection")
    }

    override suspend fun deleteGoal(id: String): Resource<Unit> = try {
        withContext(Dispatchers.IO) { api.deleteGoal(id) }
        dao.deleteById(id)
        Resource.Success(Unit)
    } catch (e: HttpException) {
        Resource.Error("Couldn't delete goal (HTTP ${e.code()})")
    } catch (e: IOException) {
        Resource.Error("Network error — check your connection")
    }
}
