import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// expo-secure-store caps each item at 2048 bytes on Android, but a Supabase
// session (access token + refresh token + user) routinely exceeds that, so
// values are split into chunks stored under indexed keys.
const CHUNK_SIZE = 2000;

function chunkKey(key: string, index: number) {
  return `${key}__${index}`;
}

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const countRaw = await SecureStore.getItemAsync(`${key}__count`);
    if (!countRaw) {
      return SecureStore.getItemAsync(key);
    }

    const count = parseInt(countRaw, 10);
    const chunks: string[] = [];
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(chunkKey(key, i));
      if (chunk === null) return null;
      chunks.push(chunk);
    }
    return chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);

    const previousCountRaw = await SecureStore.getItemAsync(`${key}__count`);
    if (previousCountRaw) {
      const previousCount = parseInt(previousCountRaw, 10);
      for (let i = 0; i < previousCount; i++) {
        await SecureStore.deleteItemAsync(chunkKey(key, i));
      }
    }

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.deleteItemAsync(`${key}__count`);
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const count = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < count; i++) {
      const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await SecureStore.setItemAsync(chunkKey(key, i), chunk);
    }
    await SecureStore.setItemAsync(`${key}__count`, String(count));
  },

  async removeItem(key: string): Promise<void> {
    const countRaw = await SecureStore.getItemAsync(`${key}__count`);
    if (countRaw) {
      const count = parseInt(countRaw, 10);
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(chunkKey(key, i));
      }
      await SecureStore.deleteItemAsync(`${key}__count`);
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
