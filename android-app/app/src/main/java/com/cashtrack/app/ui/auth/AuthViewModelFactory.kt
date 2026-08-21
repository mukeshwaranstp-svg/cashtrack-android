package com.cashtrack.app.ui.auth

import com.cashtrack.app.AppContainer

/**
 * ViewModels need the repository from the AppContainer, but Compose
 * navigation creates screens without constructor args — this factory bridges
 * the two. (With Hilt this disappears; manual DI pays one small toll.)
 */
object AuthViewModelFactory {
    fun create(container: AppContainer): AuthViewModel =
        AuthViewModel(container.authRepository)
}
