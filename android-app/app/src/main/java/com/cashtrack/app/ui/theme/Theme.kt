package com.cashtrack.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Brand palette — dark navy fintech look matching the web app.
val Navy = Color(0xFF0F172A)
val NavySurface = Color(0xFF1E293B)
val Emerald = Color(0xFF10B981)
val EmeraldDark = Color(0xFF059669)
val Rose = Color(0xFFF43F5E)
val Amber = Color(0xFFF59E0B)
val Slate300 = Color(0xFFCBD5E1)
val Slate400 = Color(0xFF94A3B8)

private val DarkColors = darkColorScheme(
    primary = Emerald,
    onPrimary = Navy,
    secondary = Amber,
    background = Navy,
    surface = NavySurface,
    onBackground = Color.White,
    onSurface = Color.White,
    error = Rose,
)

private val LightColors = lightColorScheme(
    primary = EmeraldDark,
    onPrimary = Color.White,
    secondary = Amber,
    background = Color(0xFFF8FAFC),
    surface = Color.White,
    onBackground = Color(0xFF0F172A),
    onSurface = Color(0xFF0F172A),
    error = Rose,
)

@Composable
fun CashTrackTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) DarkColors else LightColors
    val view = LocalView.current

    // Edge-to-edge: draw behind the system bars, keep icons legible.
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(colorScheme = colors, content = content)
}
