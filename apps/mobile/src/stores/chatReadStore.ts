import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ambo_chat_read_groups';

interface ChatReadStore {
  readGroups: Set<string>;
  loaded: boolean;
  markGroupRead: (groupId: string) => void;
  removeReadGroup: (groupId: string) => void;
  clearReadGroups: () => void;
  hydrate: () => Promise<void>;
}

export const useChatReadStore = create<ChatReadStore>((set, get) => ({
  readGroups: new Set(),
  loaded: false,

  markGroupRead: (groupId) => {
    set((state) => {
      const next = new Set(state.readGroups);
      next.add(groupId);
      // Persist in background
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).catch(() => {});
      return { readGroups: next };
    });
  },

  removeReadGroup: (groupId) => {
    set((state) => {
      const next = new Set(state.readGroups);
      next.delete(groupId);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).catch(() => {});
      return { readGroups: next };
    });
  },

  clearReadGroups: () => {
    set({ readGroups: new Set() });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  hydrate: async () => {
    if (get().loaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        set({ readGroups: new Set(ids), loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },
}));
