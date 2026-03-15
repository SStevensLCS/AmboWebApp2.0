import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase requires a storage adapter with getItem, setItem, removeItem.
// On native platforms, use SecureStore for encrypted storage.
// On web, fall back to AsyncStorage (SecureStore is not available on web).
//
// SecureStore has a 2048-byte value limit on iOS. Supabase JWT sessions
// can exceed this, so we fall back to AsyncStorage for large values and
// track which keys are stored where.
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
const SECURE_STORE_LIMIT = 2048;
const FALLBACK_PREFIX = '__ss_fallback__';

const SecureStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (!isNative) {
      return AsyncStorage.getItem(key);
    }
    // Check AsyncStorage fallback first (for large values)
    try {
      const fallback = await AsyncStorage.getItem(FALLBACK_PREFIX + key);
      if (fallback !== null) return fallback;
    } catch {
      // ignore
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // SecureStore can fail if the item was stored by a different app version
      return AsyncStorage.getItem(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (!isNative) {
      await AsyncStorage.setItem(key, value);
      return;
    }
    // If value is too large for SecureStore, use AsyncStorage with prefix
    if (value.length > SECURE_STORE_LIMIT) {
      await AsyncStorage.setItem(FALLBACK_PREFIX + key, value);
      // Clean up SecureStore entry if it exists
      try { await SecureStore.deleteItemAsync(key); } catch { /* ignore */ }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
      // Clean up any fallback entry
      try { await AsyncStorage.removeItem(FALLBACK_PREFIX + key); } catch { /* ignore */ }
    } catch {
      // If SecureStore fails for any reason, fall back to AsyncStorage
      await AsyncStorage.setItem(FALLBACK_PREFIX + key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (!isNative) {
      await AsyncStorage.removeItem(key);
      return;
    }
    // Remove from both stores
    try { await SecureStore.deleteItemAsync(key); } catch { /* ignore */ }
    try { await AsyncStorage.removeItem(FALLBACK_PREFIX + key); } catch { /* ignore */ }
  },
};

export default SecureStorageAdapter;
