package com.cashtrack.app.data.remote

import com.cashtrack.app.data.local.TokenStore
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Builds the two OkHttp clients and the Retrofit instance.
 *
 * Two clients on purpose:
 *  - main: AuthInterceptor + TokenAuthenticator — for all API calls.
 *  - bare: no auth machinery — used ONLY by the authenticator's refresh call,
 *    otherwise refreshing would itself trigger 401→refresh→∞.
 */
object NetworkModule {

    val json = Json {
        ignoreUnknownKeys = true   // server may add fields before the app updates
        explicitNulls = false
        encodeDefaults = true
    }

    lateinit var refreshUrl: String
        private set

    lateinit var bareClient: OkHttpClient
        private set

    fun build(tokenStore: TokenStore, baseUrl: String): CashTrackApi {
        refreshUrl = baseUrl + "api/auth/refresh"

        bareClient = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
            // Never log Authorization headers — tokens in logcat are a leak.
            redactHeader("Authorization")
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenStore))
            .authenticator(TokenAuthenticator(tokenStore, json))
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(CashTrackApi::class.java)
    }
}
