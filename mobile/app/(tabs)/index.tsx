import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { Submission } from "@/lib/types";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <Text className="text-muted text-xs font-medium uppercase tracking-wider">
        {label}
      </Text>
      <Text className="text-3xl font-bold text-primary mt-1">{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Approved: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Denied: "bg-red-100 text-red-700",
  };
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${colors[status]?.split(" ")[0] || "bg-gray-100"}`}>
      <Text className={`text-xs font-semibold ${colors[status]?.split(" ")[1] || "text-gray-700"}`}>
        {status}
      </Text>
    </View>
  );
}

function SubmissionRow({ item }: { item: Submission }) {
  return (
    <View className="bg-white rounded-xl p-4 mb-2 border border-gray-100">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm font-semibold text-primary flex-1" numberOfLines={1}>
          {item.service_type}
        </Text>
        <StatusBadge status={item.status} />
      </View>
      <View className="flex-row items-center gap-4 mt-1">
        <Text className="text-xs text-muted">
          {new Date(item.service_date).toLocaleDateString()}
        </Text>
        <Text className="text-xs text-muted">{item.hours}h</Text>
        <Text className="text-xs text-muted">{item.credits} credits</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/admin/submissions?user_id=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        // API may return { submissions: [...] } or just [...]
        setSubmissions(Array.isArray(data) ? data : data.submissions || []);
      }
    } catch {
      // Network error — keep existing data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchSubmissions();
    }, [fetchSubmissions])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubmissions();
  };

  const totalHours = submissions
    .filter((s) => s.status === "Approved")
    .reduce((sum, s) => sum + (s.hours || 0), 0);

  const totalCredits = submissions
    .filter((s) => s.status === "Approved")
    .reduce((sum, s) => sum + (s.credits || 0), 0);

  if (loading && submissions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={submissions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SubmissionRow item={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="text-lg font-bold text-primary mb-1">
              Welcome, {user?.first_name}
            </Text>
            <Text className="text-sm text-muted mb-4">
              Your ambassador activity overview
            </Text>

            <View className="flex-row gap-3 mb-4">
              <StatCard label="Hours" value={totalHours.toFixed(1)} />
              <StatCard label="Credits" value={String(totalCredits)} />
            </View>

            <Text className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Submissions
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-muted text-base">No submissions yet</Text>
            <Text className="text-muted text-sm mt-1">
              Tap &quot;Log Hours&quot; to record your first activity
            </Text>
          </View>
        }
      />
    </View>
  );
}
