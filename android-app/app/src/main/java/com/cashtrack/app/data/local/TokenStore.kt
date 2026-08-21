package com.cashtrack.app.data.local

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * JWT storage. Tokens are the keys to the account, so they live in
 * EncryptedSharedPreferences (AES-256, hardware-backed keystore key) — not in
 * plain SharedPreferences, which are readable from a rooted device or an
 * unencrypted backup.
 */
class TokenStore(context: Context) {

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "cashtrack_secure_prefs",
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    var accessToken: String?
        get() = prefs.getString(KEY_ACCESS, null)
        private set(value) = prefs.edit().putString(KEY_ACCESS, value).apply()

    var refreshToken: String?
        get() = prefs.getString(KEY_REFRESH, null)
        private set(value) = prefs.edit().putString(KEY_REFRESH, value).apply()

    val isLoggedIn: Boolean get() = accessToken != null && refreshToken != null

    fun save(access: String, refresh: String) {
        accessToken = access
        refreshToken = refresh
    }

    /** Called by TokenAuthenticator after a successful refresh. */
    fun updateAccess(access: String) {
        accessToken = access
    }

    /** Refresh token is single-use server-side; both rotate on refresh. */
    fun updateRefresh(refresh: String) {
        refreshToken = refresh
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val KEY_ACCESS = "access_token"
        private const val KEY_REFRESH = "refresh_token"
    }
}
