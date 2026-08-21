package com.cashtrack.app.util

/**
 * Every repository call returns a Resource so the UI can render exactly three
 * states — Loading / Error / Success — without try/catch scattered everywhere.
 * Coroutines + Retrofit throw exceptions on failure; this wraps them once,
 * at the boundary, into a value the UI can pattern-match on.
 */
sealed interface Resource<out T> {
    data object Loading : Resource<Nothing>
    data class Success<T>(val data: T) : Resource<T>
    data class Error(val message: String) : Resource<Nothing>
}

inline fun <T> Resource<T>.onSuccess(block: (T) -> Unit): Resource<T> {
    if (this is Resource.Success) block(data)
    return this
}

inline fun <T> Resource<T>.onError(block: (String) -> Unit): Resource<T> {
    if (this is Resource.Error) block(message)
    return this
}
