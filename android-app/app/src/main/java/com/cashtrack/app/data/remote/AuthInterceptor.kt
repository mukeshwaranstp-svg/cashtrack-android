package com.cashtrack.app.data.remote

import com.cashtrack.app.data.local.TokenStore
import okhttp3.Interceptor
import okhttp3.Response

/**
 * Attaches "Authorization: Bearer <token>" to every outgoing request.
 * The authenticator (below) handles the 401→refresh→retry cycle.
 */
class AuthInterceptor(private val tokenStore: TokenStore) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val token = tokenStore.accessToken
            ?: return chain.proceed(chain.request()) // auth endpoints: no header

        val request = chain.request().newBuilder()
            .header("Authorization", "Bearer $token")
            .build()
        return chain.proceed(request)
    }
}
