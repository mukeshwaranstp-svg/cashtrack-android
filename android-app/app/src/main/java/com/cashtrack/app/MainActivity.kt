package com.cashtrack.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.compose.rememberNavController
import com.cashtrack.app.ui.navigation.CashTrackNavGraph
import com.cashtrack.app.ui.theme.CashTrackTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val container = (application as CashTrackApp).container

        setContent {
            CashTrackTheme {
                // Auth gate: token present -> straight to the dashboard.
                val startLoggedIn = container.tokenStore.isLoggedIn
                val navController = rememberNavController()

                CashTrackNavGraph(
                    navController = navController,
                    container = container,
                    startLoggedIn = startLoggedIn,
                )
            }
        }
    }
}
