package com.cashtrack.app.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.cashtrack.app.AppContainer
import com.cashtrack.app.ui.auth.AuthViewModelFactory
import com.cashtrack.app.ui.auth.LoginScreen
import com.cashtrack.app.ui.auth.RegisterScreen
import com.cashtrack.app.ui.dashboard.DashboardScreen
import com.cashtrack.app.ui.dashboard.DashboardViewModel
import com.cashtrack.app.ui.expenses.AddExpenseScreen
import com.cashtrack.app.ui.expenses.AddExpenseViewModel
import com.cashtrack.app.ui.goals.GoalsScreen
import com.cashtrack.app.ui.goals.GoalsViewModel
import com.cashtrack.app.ui.profile.ProfileScreen
import com.cashtrack.app.ui.profile.ProfileViewModel

/**
 * Root graph: auth screens OR the logged-in shell. The start destination is
 * decided by token presence at composition time.
 */
@Composable
fun CashTrackNavGraph(
    navController: NavHostController,
    container: AppContainer,
    startLoggedIn: Boolean,
) {
    val startRoute = if (startLoggedIn) Screen.Dashboard.route else Screen.Login.route

    NavHost(navController = navController, startDestination = startRoute) {

        composable(Screen.Login.route) {
            LoginScreen(
                viewModel = AuthViewModelFactory.create(container),
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onGoToRegister = { navController.navigate(Screen.Register.route) },
            )
        }

        composable(Screen.Register.route) {
            RegisterScreen(
                viewModel = AuthViewModelFactory.create(container),
                onRegisterSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onBackToLogin = { navController.popBackStack() },
            )
        }

        composable(Screen.Dashboard.route) {
            MainShell(navController, container)
        }

        composable(Screen.AddExpense.route) {
            AddExpenseScreen(
                viewModel = AddExpenseViewModel(container.expenseRepository),
                onDone = { navController.popBackStack() },
            )
        }
    }
}

/** Bottom-bar shell hosting Dashboard / Goals / Profile as an inner NavHost. */
@Composable
private fun MainShell(rootNav: NavHostController, container: AppContainer) {
    val innerNav = rememberNavController()

    Scaffold(
        floatingActionButton = {
            // FAB only on the Dashboard tab.
            val backStack by innerNav.currentBackStackEntryAsState()
            if (backStack?.destination?.route == Screen.Dashboard.route) {
                ExtendedFloatingActionButton(
                    onClick = { rootNav.navigate(Screen.AddExpense.route) },
                    text = { Text("Log expense") },
                    icon = { Icon(Icons.Default.AddCircle, contentDescription = null) },
                )
            }
        },
        bottomBar = {
            NavigationBar {
                val backStack by innerNav.currentBackStackEntryAsState()
                val current = backStack?.destination?.route
                listOf(
                    Triple("Home", Icons.Default.Home, Screen.Dashboard.route),
                    Triple("Goals", Icons.Default.Flag, Screen.Goals.route),
                    Triple("Profile", Icons.Default.Person, Screen.Profile.route),
                ).forEach { (label, icon, route) ->
                    NavigationBarItem(
                        selected = current == route,
                        onClick = {
                            innerNav.navigate(route) {
                                popUpTo(innerNav.graph.startDestinationId) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(icon, contentDescription = label) },
                        label = { Text(label) },
                    )
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = innerNav,
            startDestination = Screen.Dashboard.route,
            modifier = Modifier.padding(padding),
        ) {
            composable(Screen.Dashboard.route) {
                Box(Modifier.fillMaxSize()) {
                    DashboardScreen(DashboardViewModel(container.expenseRepository))
                }
            }
            composable(Screen.Goals.route) {
                GoalsScreen(GoalsViewModel(container.goalRepository))
            }
            composable(Screen.Profile.route) {
                ProfileScreen(
                    viewModel = ProfileViewModel(container.authRepository),
                    onLoggedOut = {
                        rootNav.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true } // wipe the whole back stack
                        }
                    },
                )
            }
        }
    }
}
