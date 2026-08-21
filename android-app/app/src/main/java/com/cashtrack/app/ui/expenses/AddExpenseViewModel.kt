package com.cashtrack.app.ui.expenses

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cashtrack.app.domain.model.LogExpenseResult
import com.cashtrack.app.domain.repository.ExpenseRepository
import com.cashtrack.app.util.Resource
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/** Must match app/categories.py on the backend — order = UI display order. */
val CATEGORIES = listOf(
    "Food", "Rent", "Transport", "Bills", "Education", "Medical",
    "Utilities", "Mobile & Internet", "Entertainment", "Shopping",
    "Coffee & Cafes", "Dining Out", "Gaming", "Gifts", "Travel", "Fun",
    "Savings/Investment",
)

data class AddExpenseUiState(
    val amountText: String = "",
    val category: String = "Food",
    val note: String = "",
    val isSaving: Boolean = false,
    val error: String? = null,
    /** Non-null → show milestone celebration, then navigate back. */
    val savedResult: LogExpenseResult? = null,
)

class AddExpenseViewModel(private val expenseRepository: ExpenseRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(AddExpenseUiState())
    val uiState: StateFlow<AddExpenseUiState> = _uiState.asStateFlow()

    fun onAmountChange(value: String) =
        _uiState.update { it.copy(amountText = value.filter { c -> c.isDigit() || c == '.' }, error = null) }

    fun onCategoryChange(value: String) = _uiState.update { it.copy(category = value) }
    fun onNoteChange(value: String) = _uiState.update { it.copy(note = value) }
    fun dismissCelebration() = _uiState.update { it.copy(savedResult = null) }

    fun save(onDone: () -> Unit) {
        val s = _uiState.value
        val amount = s.amountText.toDoubleOrNull()
        if (amount == null || amount <= 0) {
            _uiState.update { it.copy(error = "Enter an amount greater than 0") }
            return
        }

        _uiState.update { it.copy(isSaving = true, error = null) }
        viewModelScope.launch {
            when (val result = expenseRepository.logExpense(amount, s.category, s.note.trim(), null)) {
                is Resource.Success -> _uiState.update {
                    // Milestone hit → celebrate first; otherwise straight back.
                    if (result.data.milestoneReached) {
                        it.copy(isSaving = false, savedResult = result.data)
                    } else {
                        it.copy(isSaving = false)
                    }.also { state ->
                        if (state.savedResult == null) onDone()
                    }
                }
                is Resource.Error -> _uiState.update {
                    it.copy(isSaving = false, error = result.message)
                }
                Resource.Loading -> Unit
            }
        }
    }
}
