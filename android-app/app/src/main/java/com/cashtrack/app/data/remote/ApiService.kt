package com.cashtrack.app.data.remote

import com.cashtrack.app.data.remote.dto.AuthResponse
import com.cashtrack.app.data.remote.dto.ExpenseCreateRequest
import com.cashtrack.app.data.remote.dto.ExpenseCreateResponse
import com.cashtrack.app.data.remote.dto.ExpenseDto
import com.cashtrack.app.data.remote.dto.ExpenseReviewUpdate
import com.cashtrack.app.data.remote.dto.ExpenseWriteResponse
import com.cashtrack.app.data.remote.dto.GoalCreateRequest
import com.cashtrack.app.data.remote.dto.GoalDto
import com.cashtrack.app.data.remote.dto.LoginRequest
import com.cashtrack.app.data.remote.dto.RefreshRequest
import com.cashtrack.app.data.remote.dto.RegisterRequest
import com.cashtrack.app.data.remote.dto.SettingsDto
import com.cashtrack.app.data.remote.dto.SimpleResponse
import com.cashtrack.app.data.remote.dto.StreakDto
import com.cashtrack.app.data.remote.dto.SummaryDto
import com.cashtrack.app.data.remote.dto.TokenPair
import com.cashtrack.app.data.remote.dto.UserDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * One interface per backend resource group. All functions are `suspend` —
 * Retrofit dispatches them on OkHttp's thread pool, so no main-thread
 * network calls are possible by construction.
 */
interface CashTrackApi {

    // ---- Auth ----
    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponse

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    /** Called only by TokenAuthenticator (bare client, no interceptor loop). */
    @POST("api/auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): TokenPair

    @GET("api/auth/me")
    suspend fun me(): UserDto

    // ---- Expenses ----
    @POST("api/expense")
    suspend fun createExpense(@Body body: ExpenseCreateRequest): ExpenseCreateResponse

    @GET("api/expenses")
    suspend fun listExpenses(@Query("limit") limit: Int = 500): List<ExpenseDto>

    @PUT("api/expense/{id}")
    suspend fun updateExpense(@Path("id") id: String, @Body body: ExpenseCreateRequest): ExpenseWriteResponse

    @PATCH("api/expense/{id}")
    suspend fun reviewExpense(@Path("id") id: String, @Body body: ExpenseReviewUpdate): ExpenseWriteResponse

    @DELETE("api/expense/{id}")
    suspend fun deleteExpense(@Path("id") id: String): SimpleResponse

    // ---- Insights ----
    @GET("api/summary")
    suspend fun summary(): SummaryDto

    @GET("api/streak")
    suspend fun streak(): StreakDto

    // ---- Goals ----
    @GET("api/goals")
    suspend fun listGoals(): List<GoalDto>

    @POST("api/goals")
    suspend fun createGoal(@Body body: GoalCreateRequest): GoalDto

    @PUT("api/goals/{id}")
    suspend fun updateGoal(@Path("id") id: String, @Body body: GoalDto): GoalDto

    @DELETE("api/goals/{id}")
    suspend fun deleteGoal(@Path("id") id: String): SimpleResponse

    // ---- Settings ----
    @GET("api/settings")
    suspend fun getSettings(): SettingsDto

    @POST("api/settings")
    suspend fun updateSettings(@Body body: SettingsDto): SettingsDto
}
