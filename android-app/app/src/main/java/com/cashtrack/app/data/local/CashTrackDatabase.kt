package com.cashtrack.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.cashtrack.app.data.local.dao.ExpenseDao
import com.cashtrack.app.data.local.dao.GoalDao
import com.cashtrack.app.data.local.entity.ExpenseEntity
import com.cashtrack.app.data.local.entity.GoalEntity

@Database(
    entities = [ExpenseEntity::class, GoalEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class CashTrackDatabase : RoomDatabase() {

    abstract fun expenseDao(): ExpenseDao
    abstract fun goalDao(): GoalDao

    companion object {
        fun build(context: Context): CashTrackDatabase =
            Room.databaseBuilder(context, CashTrackDatabase::class.java, "cashtrack.db")
                .fallbackToDestructiveMigration() // v1: fine; replace with real migrations later
                .build()
    }
}
