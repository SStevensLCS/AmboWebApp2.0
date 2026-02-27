import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { apiFetch, getStoredToken } from "@/lib/api";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [uploading, setUploading] = useState(false);

  const pickAndUploadAvatar = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to upload an avatar."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const token = await getStoredToken();

      const formData = new FormData();
      formData.append("avatar", {
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: `avatar.${asset.uri.split(".").pop() || "jpg"}`,
      } as unknown as Blob);

      const res = await fetch(`${API_BASE_URL}/api/users/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        await refreshUser();
        Alert.alert("Success", "Avatar updated!");
      } else {
        const data = await res.json();
        Alert.alert("Error", data.error || "Failed to upload avatar.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16 }}>
      {/* Avatar + Name */}
      <View className="items-center py-6">
        <TouchableOpacity
          onPress={pickAndUploadAvatar}
          disabled={uploading}
          activeOpacity={0.7}
        >
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              className="w-24 h-24 rounded-full bg-gray-200"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
              <Ionicons name="person" size={40} color="#9ca3af" />
            </View>
          )}
          {uploading ? (
            <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white items-center justify-center shadow-sm">
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : (
            <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent items-center justify-center shadow-sm">
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <Text className="text-xl font-bold text-primary mt-3">
          {user?.first_name} {user?.last_name}
        </Text>
        <Text className="text-muted text-sm capitalize">{user?.role}</Text>
      </View>

      {/* Info Cards */}
      <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
        <View className="flex-row items-center px-4 py-3.5 border-b border-gray-100">
          <Ionicons name="mail-outline" size={20} color="#6b7280" />
          <View className="ml-3 flex-1">
            <Text className="text-xs text-muted">Email</Text>
            <Text className="text-sm text-primary">{user?.email}</Text>
          </View>
        </View>
        <View className="flex-row items-center px-4 py-3.5">
          <Ionicons name="call-outline" size={20} color="#6b7280" />
          <View className="ml-3 flex-1">
            <Text className="text-xs text-muted">Phone</Text>
            <Text className="text-sm text-primary">
              {user?.phone
                ? `(${user.phone.slice(0, 3)}) ${user.phone.slice(3, 6)}-${user.phone.slice(6)}`
                : "Not set"}
            </Text>
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex-row items-center"
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text className="ml-3 text-danger font-medium">Sign Out</Text>
      </TouchableOpacity>

      <Text className="text-center text-xs text-muted mt-8">
        Ambassador Portal v1.0.0
      </Text>
    </ScrollView>
  );
}
