package com.cashtrack.app

import android.app.Application
import com.cashtrack.app.BuildConfig
import com.cashtrack.app.data.local.CashTrackDatabase
import com.cashtrack.app.data.local.TokenStore
import com.cashtrack.app.data.remote.NetworkModule
import com.cashtrack.app.data.repository.AuthRepositoryImpl
import com.cashtrack.app.data.repository.ExpenseRepositoryImpl
import com.cashtrack.app.data.repository.GoalRepositoryImpl
import com.cashtrack.app.domain.repository.AuthRepository
import com.cashtrack.app.domain.repository.ExpenseRepository
import com.cashtrack.app.domain.repository.GoalRepository

/**
 * Manual dependency container — one place that builds the object graph:
 * TokenStore -> OkHttp -> Retrofit -> ApiService -> Repositories -> ViewModels.
 *
 * Deliberately no Hilt/Dagger: for an app this size, a hand-wired graph is
 * easier to read and debug than annotation processing, while keeping the same
 * Clean Architecture boundaries (UI never touches Retrofit or Room directly).
 */
class CashTrackApp : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}

class AppContainer(app: Application) {

    val tokenStore: TokenStore = TokenStore(app)

    private val api = NetworkModule.build(tokenStore, BuildConfig.BASE_URL)

    private val database by lazy { CashTrackDatabase.build(app) }

    // Repositories are the only thing the UI layer is allowed to see.
    val authRepository: AuthRepository = AuthRepositoryImpl(api, tokenStore)
    val expenseRepository: ExpenseRepository by lazy {
        ExpenseRepositoryImpl(api, database.expenseDao())
    }
    val goalRepository: GoalRepository by lazy {
        GoalRepositoryImpl(api, database.goalDao())
    }
}
