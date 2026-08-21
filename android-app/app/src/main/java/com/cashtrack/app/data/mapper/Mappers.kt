package com.cashtrack.app.data.mapper

import com.cashtrack.app.data.local.entity.ExpenseEntity
import com.cashtrack.app.data.local.entity.GoalEntity
import com.cashtrack.app.data.remote.dto.ExpenseDto
import com.cashtrack.app.data.remote.dto.GoalDto
import com.cashtrack.app.domain.model.Expense
import com.cashtrack.app.domain.model.Goal

/** DTO -> Entity -> Domain: each layer converts only at its boundary. */

fun ExpenseDto.toEntity() = ExpenseEntity(
    id = id, amount = amount, category = category, bucket = bucket,
    note = note, date = date, timestamp = timestamp,
    reviewed = reviewed, justified = justified,
    goalId = goalId, goalName = goalName, goalImage = goalImage,
)

fun ExpenseEntity.toDomain() = Expense(
    id = id, amount = amount, category = category, bucket = bucket,
    note = note, date = date, timestamp = timestamp,
    reviewed = reviewed, justified = justified,
    goalId = goalId, goalName = goalName,
)

fun List<ExpenseDto>.toEntities() = map { it.toEntity() }
fun List<ExpenseEntity>.toDomains() = map { it.toDomain() }

fun GoalDto.toEntity() = GoalEntity(
    id = id, name = name, target = target, current = current,
    image = image, deadline = deadline, priority = priority,
    notes = notes, completed = completed, completionDate = completionDate,
    difficulty = difficulty, status = status,
)

fun GoalEntity.toDomain() = Goal(
    id = id, name = name, target = target, current = current,
    image = image, deadline = deadline, completed = completed, status = status,
)

fun List<GoalDto>.toGoalEntities() = map { it.toEntity() }
fun List<GoalEntity>.toGoalDomains() = map { it.toDomain() }
