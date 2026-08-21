package com.cashtrack.app.data.repository

import com.cashtrack.app.data.local.TokenStore
import com.cashtrack.app.data.remote.ApiService
import com.cashtrack.app.data.remote.dto.LoginRequest
import com.cashtrack.app.data.remote.dto.RegisterRequest
import com.cashtrack.app.domain.model.User
import com.cashtrack.app.domain.repository.AuthRepository
import com.cashtrack.app.util.Resource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.withContext
import retrofit2.HttpException
import java.io.IOException

/**
 * Wraps every network call in runCatching and maps failures to Resource.Error.
 * FastAPI errors are {"detail": "..."} — surfaced straight to the UI so the
 * user sees the server's actual message ("Incorrect email or password").
 */
class AuthRepositoryImpl(
    private val api: ApiService,
    private val tokenStore: TokenStore,
) : AuthRepository {

    private val _authState = MutableStateFlow(tokenStore.isLoggedIn)
    override val authState: Flow<Boolean> = _authState

    override suspend fun register(
        email: String,
        password: String,
        username: String,
    ): Resource<User> = withContext(Dispatchers.IO) {
        try {
            val response = api.register(RegisterRequest(email, password, username))
            tokenStore.save(response.accessToken, response.refreshToken)
            _authState.value = true
            Resource.Success(
                User(response.user.id, response.user.email, response.user.username)
            )
        } catch (e: HttpException) {
            Resource.Error(e.detailMessage() ?: "Registration failed")
        } catch (e: IOException) {
            Resource.Error("Network error — is the server reachable?")
        }
    }

    override suspend fun login(email: String, password: String): Resource<User> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.login(LoginRequest(email, password))
                tokenStore.save(response.accessToken, response.refreshToken)
                _authState.value = true
                Resource.Success(
                    User(response.user.id, response.user.email, response.user.username)
                )
            } catch (e: HttpException) {
                Resource.Error(e.detailMessage() ?: "Login failed")
            } catch (e: IOException) {
                Resource.Error("Network error — is the server reachable?")
            }
        }

    override suspend fun logout() {
        // Server-side tokens are stateless JWTs; logout is client-side only.
        tokenStore.clear()
        _authState.value = false
    }

    private fun HttpException.detailMessage(): String? = try {
        val body = response()?.errorBody()?.string().orEmpty()
        Regex("\"detail\"\\s*:\\s*\"([^\"]+)\"").find(body)?.groupValues?.get(1)
    } catch (_: Exception) {
        null
    }
}
