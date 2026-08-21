package com.cashtrack.app.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.cashtrack.app.domain.model.BucketSummary
import com.cashtrack.app.domain.model.Expense
import com.cashtrack.app.ui.theme.Amber
import com.cashtrack.app.ui.theme.Emerald
import com.cashtrack.app.ui.theme.Rose
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val money = java.text.NumberFormat.getNumberInstance(Locale.US)

@Composable
fun DashboardScreen(viewModel: DashboardViewModel) {
    val state by viewModel.uiState.collectAsState()
    val expenses by viewModel.expenses.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item { Spacer(Modifier.height(4.dp)) }

        // ---- Streak + total spend hero card ----
        item {
            state.summary?.let { s ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(20.dp),
                ) {
                    Column(Modifier.padding(20.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column {
                                Text("This month", style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                Text(
                                    "₹${money.format(s.totalSpend)}",
                                    style = MaterialTheme.typography.headlineLarge,
                                    fontWeight = FontWeight.Black,
                                )
                                Text(
                                    "of ₹${money.format(s.monthlyBudget)} budget",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                )
                            }
                            StreakBadge(s.streak.currentStreak, s.streak.loggedToday)
                        }
                    }
                }
            }
        }

        // ---- 70/20/10 buckets ----
        item {
            state.summary?.let { s ->
                Text("70 / 20 / 10", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    s.buckets.forEach { BucketRow(it) }
                }
            }
        }

        // ---- Recent transactions ----
        item {
            Text("Recent", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
        items(expenses.take(10), key = { it.id }) { expense ->
            TransactionRow(expense)
        }

        state.error?.let {
            item {
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }
        }

        item { Spacer(Modifier.height(80.dp)) } // bottom-bar clearance
    }
}

@Composable
private fun StreakBadge(days: Int, loggedToday: Boolean) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .background(Emerald.copy(alpha = 0.15f), RoundedCornerShape(16.dp))
            .padding(horizontal = 14.dp, vertical = 8.dp),
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("🔥 $days", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
            Text(
                if (loggedToday) "logged today" else "log today!",
                style = MaterialTheme.typography.labelSmall,
                color = if (loggedToday) Emerald else Amber,
            )
        }
    }
}

@Composable
private fun BucketRow(bucket: BucketSummary) {
    val color = when (bucket.bucket) {
        "Needs" -> Emerald
        "Wants" -> Amber
        else -> Rose
    }
    Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surface
    )) {
        Column(Modifier.padding(14.dp)) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("${bucket.bucket} · ${bucket.targetPercentage.toInt()}%",
                    style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                Text(
                    "₹${money.format(bucket.amount)} / ₹${money.format(bucket.targetAmount)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (bucket.isOverBudget) Rose else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                )
            }
            Spacer(Modifier.height(8.dp))
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .background(color.copy(alpha = 0.2f), RoundedCornerShape(3.dp))
            ) {
                Box(
                    Modifier
                        .fillMaxWidth(bucket.limitPercentage.toFloat().coerceIn(0f, 1f) * 1f)
                        .height(6.dp)
                        .background(if (bucket.isOverBudget) Rose else color, RoundedCornerShape(3.dp))
                )
            }
        }
    }
}

@Composable
private fun TransactionRow(expense: Expense) {
    val dateLabel = remember(expense.timestamp) { formatTimestamp(expense.timestamp) }
    Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surface
    )) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(expense.category, fontWeight = FontWeight.SemiBold,
                    style = MaterialTheme.typography.bodyMedium)
                if (expense.note.isNotBlank()) {
                    Text(expense.note,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        maxLines = 1)
                }
                Text(dateLabel,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
            }
            Spacer(Modifier.width(8.dp))
            Text(
                "-₹${money.format(expense.amount)}",
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.bodyMedium,
                color = Rose,
            )
        }
    }
}

private fun formatTimestamp(iso: String): String = try {
    val parsed = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).parse(iso.take(19))
        ?: return iso.take(10)
    SimpleDateFormat("dd MMM, hh:mm a", Locale.US).format(parsed ?: Date())
} catch (_: Exception) {
    iso.take(10)
}
