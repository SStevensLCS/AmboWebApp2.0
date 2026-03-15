import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase requires a storage adapter with getItem, setItem, removeItem.
// On native platforms, use SecureStore for encrypted storage.
// On web, fall back to AsyncStorage (SecureStore is not available on web).
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

const SecureStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (isNative) {
      return SecureStore.getItemAsync(key);
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (isNative) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (isNative) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};

export default SecureStorageAdapter;
