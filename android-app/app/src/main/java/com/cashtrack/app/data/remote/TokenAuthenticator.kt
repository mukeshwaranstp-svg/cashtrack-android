package com.cashtrack.app.data.remote

import com.cashtrack.app.data.local.TokenStore
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName
import kotlinx.serialization.json.Json
import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route

/**
 * OkHttp calls this automatically whenever a request comes back 401.
 *
 * Flow: refresh the token (synchronously — OkHttp authenticators run on a
 * network thread), swap it into the store, and return the retried request.
 * If refresh fails, clear tokens → the app's auth-state check logs out.
 *
 * Race guard: two parallel requests can both 401. The second one sees its
 * header token no longer matches the stored token (first thread already
 * refreshed) and retries with the NEW token instead of refreshing again.
 */
class TokenAuthenticator(
    private val tokenStore: TokenStore,
    private val json: Json,
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        if (responseCount(response) >= 2) return null // already retried once

        val failedToken = response.request.header("Authorization")?.removePrefix("Bearer ")
        synchronized(this) {
            val current = tokenStore.accessToken
            if (current != null && current != failedToken) {
                // Another thread refreshed while we waited — use its token.
                return response.request.newBuilder()
                    .header("Authorization", "Bearer $current")
                    .build()
            }

            val refreshToken = tokenStore.refreshToken ?: return null
            val newTokens = try {
                runBlocking { refreshSync(refreshToken) }
            } catch (_: Exception) {
                // Refresh rejected or network died mid-refresh → full logout.
                tokenStore.clear()
                return null
            }

            tokenStore.save(newTokens.first, newTokens.second)
            return response.request.newBuilder()
                .header("Authorization", "Bearer ${newTokens.first}")
                .build()
        }
    }

    /** Bare OkHttp call — deliberately NOT the intercepted Retrofit client. */
    private fun refreshSync(refreshToken: String): Pair<String, String> {
        val body = """{"refresh_token":"$refreshToken"}"""
            .toRequestBody("application/json".toMediaType())
        val request = Request.Builder()
            .url(NetworkModule.refreshUrl)
            .post(body)
            .build()

        NetworkModule.bareClient.newCall(request).execute().use { resp ->
            check(resp.isSuccessful) { "Refresh failed: HTTP ${resp.code}" }
            val parsed = json.decodeFromString(
                RefreshResponse.serializer(),
                resp.body?.string().orEmpty(),
            )
            return parsed.accessToken to parsed.refreshToken
        }
    }

    @Serializable
    private data class RefreshResponse(
        @SerialName("accessToken") val accessToken: String,
        @SerialName("refreshToken") val refreshToken: String,
    )

    private fun responseCount(response: Response): Int {
        var count = 1
        var prior = response.priorResponse
        while (prior != null) {
            count++
            prior = prior.priorResponse
        }
        return count
    }
}
