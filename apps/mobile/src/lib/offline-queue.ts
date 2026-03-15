import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'ambo_offline_queue';

export interface QueuedMutation {
  id: string;
  table: string;
  type: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  filter?: Record<string, unknown>;
  createdAt: string;
}

export async function enqueueMutation(mutation: Omit<QueuedMutation, 'id' | 'createdAt'>): Promise<void> {
  const queue = await getQueue();
  queue.push({
    ...mutation,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueue(): Promise<QueuedMutation[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function removeMutation(id: string): Promise<void> {
  const queue = await getQueue();
  const updated = queue.filter((m) => m.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
