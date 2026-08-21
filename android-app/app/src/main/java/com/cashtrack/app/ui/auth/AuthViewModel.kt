package com.cashtrack.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cashtrack.app.domain.repository.AuthRepository
import com.cashtrack.app.util.Resource
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AuthUiState(
    val email: String = "",
    val password: String = "",
    val username: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
)

/**
 * Holds form state + calls the repository. Screens stay dumb: they render
 * state and forward events; all logic lives here and survives rotation.
 */
class AuthViewModel(private val authRepository: AuthRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun onEmailChange(value: String) = _uiState.update { it.copy(email = value.trim(), error = null) }
    fun onPasswordChange(value: String) = _uiState.update { it.copy(password = value, error = null) }
    fun onUsernameChange(value: String) = _uiState.update { it.copy(username = value.trim()) }

    fun login(onSuccess: () -> Unit) {
        val s = _uiState.value
        if (!validate(s)) return
        _uiState.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            when (val result = authRepository.login(s.email, s.password)) {
                is Resource.Success -> onSuccess()
                is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = result.message) }
                Resource.Loading -> Unit
            }
        }
    }

    fun register(onSuccess: () -> Unit) {
        val s = _uiState.value
        if (!validate(s)) return
        _uiState.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            when (val result = authRepository.register(s.email, s.password, s.username)) {
                is Resource.Success -> onSuccess()
                is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = result.message) }
                Resource.Loading -> Unit
            }
        }
    }

    /** Client-side checks give instant feedback; the server re-validates anyway. */
    private fun validate(state: AuthUiState): Boolean {
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(state.email).matches()) {
            _uiState.update { it.copy(error = "Enter a valid email") }
            return false
        }
        if (state.password.length < 8) {
            _uiState.update { it.copy(error = "Password must be at least 8 characters") }
            return false
        }
        return true
    }
}
