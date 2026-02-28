import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { SERVICE_TYPES } from "@/lib/types";

export default function LogHoursScreen() {
  const { user } = useAuth();
  const [serviceType, setServiceType] = useState("");
  const [serviceDate, setServiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [hours, setHours] = useState("");
  const [credits, setCredits] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const handleSubmit = async () => {
    if (!serviceType) {
      Alert.alert("Missing Field", "Please select a service type.");
      return;
    }
    if (!serviceDate) {
      Alert.alert("Missing Field", "Please enter a service date.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          user_id: user?.id,
          service_type: serviceType,
          service_date: serviceDate,
          hours: parseFloat(hours) || 0,
          credits: parseInt(credits, 10) || 0,
          feedback: feedback.trim() || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        Alert.alert("Error", data.error || "Failed to submit.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setServiceType("");
    setServiceDate(new Date().toISOString().split("T")[0]);
    setHours("");
    setCredits("");
    setFeedback("");
    setSuccess(false);
  };

  if (success) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8">
        <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
          <Ionicons name="checkmark-circle" size={40} color="#22c55e" />
        </View>
        <Text className="text-xl font-bold text-primary mb-2">Submitted!</Text>
        <Text className="text-muted text-center mb-6">
          Your service hours have been submitted and are pending review.
        </Text>
        <TouchableOpacity
          className="bg-accent rounded-xl py-3.5 px-8"
          onPress={resetForm}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">Log Another</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-lg font-bold text-primary mb-4">
          Log Service Hours
        </Text>

        {/* Service Type Picker */}
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Service Type *
        </Text>
        <TouchableOpacity
          className="border border-gray-300 rounded-xl px-4 py-3.5 mb-4 bg-white flex-row items-center justify-between"
          onPress={() => setShowPicker(!showPicker)}
          activeOpacity={0.7}
        >
          <Text className={serviceType ? "text-primary" : "text-gray-400"}>
            {serviceType || "Select a service type"}
          </Text>
          <Ionicons
            name={showPicker ? "chevron-up" : "chevron-down"}
            size={18}
            color="#6b7280"
          />
        </TouchableOpacity>

        {showPicker && (
          <View className="border border-gray-200 rounded-xl mb-4 bg-white overflow-hidden">
            {SERVICE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                className={`px-4 py-3 border-b border-gray-100 ${
                  serviceType === type ? "bg-blue-50" : ""
                }`}
                onPress={() => {
                  setServiceType(type);
                  setShowPicker(false);
                }}
              >
                <Text
                  className={`text-sm ${
                    serviceType === type
                      ? "text-accent font-semibold"
                      : "text-primary"
                  }`}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Service Date */}
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Service Date *
        </Text>
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3.5 text-base mb-4 bg-white"
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
          value={serviceDate}
          onChangeText={setServiceDate}
        />

        {/* Hours */}
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Hours Served
        </Text>
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3.5 text-base mb-4 bg-white"
          placeholder="e.g., 2.5"
          placeholderTextColor="#9ca3af"
          value={hours}
          onChangeText={setHours}
          keyboardType="decimal-pad"
        />

        {/* Credits */}
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Tour Credits
        </Text>
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3.5 text-base mb-4 bg-white"
          placeholder="e.g., 1"
          placeholderTextColor="#9ca3af"
          value={credits}
          onChangeText={setCredits}
          keyboardType="number-pad"
        />

        {/* Notes */}
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Notes
        </Text>
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3.5 text-base mb-4 bg-white"
          placeholder="Optional feedback or notes"
          placeholderTextColor="#9ca3af"
          value={feedback}
          onChangeText={setFeedback}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{ minHeight: 80 }}
        />

        {/* Submit */}
        <TouchableOpacity
          className={`rounded-xl py-4 items-center mt-2 ${
            loading ? "bg-blue-300" : "bg-accent"
          }`}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Submit Hours
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
