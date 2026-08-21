package com.cashtrack.app.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// Field names mirror the FastAPI backend's wire format exactly.
// The one snake_case exception: /api/auth/refresh expects "refresh_token".

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val username: String = "",
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

@Serializable
data class RefreshRequest(
    @SerialName("refresh_token") val refreshToken: String,
)

@Serializable
data class UserDto(
    val id: String,
    val email: String,
    val username: String,
    @SerialName("createdAt") val createdAt: String,
)

@Serializable
data class AuthResponse(
    val user: UserDto,
    @SerialName("accessToken") val accessToken: String,
    @SerialName("refreshToken") val refreshToken: String,
    @SerialName("tokenType") val tokenType: String,
    /** Access-token lifetime in seconds — schedule proactive refresh off this. */
    @SerialName("expiresIn") val expiresIn: Int,
)

@Serializable
data class TokenPair(
    @SerialName("accessToken") val accessToken: String,
    @SerialName("refreshToken") val refreshToken: String,
    @SerialName("tokenType") val tokenType: String,
    @SerialName("expiresIn") val expiresIn: Int,
)
