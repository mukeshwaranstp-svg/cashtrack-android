package com.cashtrack.app.ui.goals

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cashtrack.app.domain.repository.GoalRepository
import com.cashtrack.app.util.Resource
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class GoalsUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
)

class GoalsViewModel(private val goalRepository: GoalRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(GoalsUiState())
    val uiState: StateFlow<GoalsUiState> = _uiState.asStateFlow()

    val goals = goalRepository.observeGoals()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    init {
        refresh()
    }

    fun refresh() {
        _uiState.update { it.copy(isLoading = true) }
        viewModelScope.launch {
            val result = goalRepository.refresh()
            _uiState.update {
                it.copy(
                    isLoading = false,
                    error = (result as? Resource.Error)?.message,
                )
            }
        }
    }

    fun createGoal(name: String, targetText: String) {
        val target = targetText.toDoubleOrNull()
        if (name.isBlank() || target == null || target <= 0) {
            _uiState.update { it.copy(error = "Enter a name and a positive target") }
            return
        }
        viewModelScope.launch {
            when (val result = goalRepository.createGoal(name.trim(), target, "🎯")) {
                is Resource.Error -> _uiState.update { it.copy(error = result.message) }
                else -> _uiState.update { it.copy(error = null) }
            }
        }
    }

    fun deleteGoal(id: String) {
        viewModelScope.launch { goalRepository.deleteGoal(id) }
    }
}
