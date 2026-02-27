import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";

export default function LoginScreen() {
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password) {
      setError("Please enter your email/phone and password.");
      return;
    }

    setError("");
    setLoading(true);

    const result = await login(emailOrPhone.trim(), password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-8 py-12">
          {/* Logo / Header */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">A</Text>
            </View>
            <Text className="text-2xl font-bold text-primary">
              Ambassador Portal
            </Text>
            <Text className="text-muted mt-1">
              Sign in to your account
            </Text>
          </View>

          {/* Error message */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-danger text-sm text-center">{error}</Text>
            </View>
          ) : null}

          {/* Email / Phone input */}
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Email or Phone Number
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3.5 text-base mb-4 bg-surface"
            placeholder="email@linfield.edu or 10-digit phone"
            placeholderTextColor="#9ca3af"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
          />

          {/* Password input */}
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Password
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3.5 text-base mb-6 bg-surface"
            placeholder="Enter your password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
          />

          {/* Login button */}
          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${
              loading ? "bg-blue-300" : "bg-accent"
            }`}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
