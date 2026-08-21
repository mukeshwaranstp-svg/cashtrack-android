package com.cashtrack.app.ui.navigation

/**
 * Type-safe route names. The start destination is decided at runtime by
 * auth state: no token -> Login, token -> Main (bottom-bar shell).
 */
sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object Register : Screen("register")
    data object Dashboard : Screen("dashboard")
    data object AddExpense : Screen("add_expense")
    data object Goals : Screen("goals")
    data object Profile : Screen("profile")
}
