# Keep kotlinx.serialization generated serializers.
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** { *** Companion; }
-keepclasseswithmembers class kotlinx.serialization.json.** { kotlinx.serialization.KSerializer serializer(...); }
-keep,includedescriptorclasses class com.cashtrack.app.**$$serializer { *; }
-keepclassmembers class com.cashtrack.app.** { *** Companion; }
-keepclasseswithmembers class com.cashtrack.app.** { kotlinx.serialization.KSerializer serializer(...); }

# Retrofit/OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-keepattributes Signature, Exceptions
