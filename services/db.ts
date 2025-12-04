import { MMKV } from 'react-native-mmkv';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// --- 1. SAFE STORAGE INITIALIZATION ---
let storage: MMKV | null = null;
try {
  // @ts-ignore: Suppress "MMKV is a type" error
  storage = new MMKV({ id: 'app-db' });
} catch (e) {
  console.warn("⚠️ MMKV failed to load (Running in Expo Go?). Swapping to In-Memory Storage.");
}

// --- 2. IN-MEMORY FALLBACK (For Expo Go) ---
// This ensures the app works even if MMKV crashes.
const memoryStore = new Map<string, string>();

// --- 3. MMKV ADAPTER FOR SUPABASE ---
const mmkvSupabaseAdapter = {
  getItem: (key: string) => {
    const val = storage?.getString(key);
    return val ?? memoryStore.get(key) ?? null;
  },
  setItem: (key: string, value: string) => {
    if (storage) storage.set(key, value);
    else memoryStore.set(key, value);
  },
  removeItem: (key: string) => {
    if (storage) (storage as any)?.delete(key);
    else memoryStore.delete(key);
  },
};

// --- 4. SUPABASE SETUP ---
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: mmkvSupabaseAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }) 
  : null;

if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const isLive = !!supabase;

// --- 5. HYBRID ADAPTER (Data Layer) ---
const localDb = {
  get: (key: string) => {
    // Try MMKV first, then Memory
    const val = storage ? storage.getString(key) : memoryStore.get(key);
    return val ? JSON.parse(val) : [];
  },
  set: (key: string, value: any) => {
    const str = JSON.stringify(value);
    if (storage) storage.set(key, str);
    else memoryStore.set(key, str);
  }
};

export const db = {
  from: (table: string) => ({
    select: async () => {
      if (isLive) return supabase!.from(table).select('*');
      
      console.log(`[MOCK] Reading '${table}' (Source: ${storage ? 'MMKV' : 'Memory'})`);
      return { data: localDb.get(table), error: null };
    },
    insert: async (payload: any) => {
      if (isLive) return supabase!.from(table).insert(payload).select();
      
      const current = localDb.get(table);
      const newItem = { id: Math.random().toString(36).substring(7), ...payload };
      localDb.set(table, [...current, newItem]);
      
      console.log(`[MOCK] Saved to '${table}' (Source: ${storage ? 'MMKV' : 'Memory'})`);
      return { data: [newItem], error: null };
    },
    // Mock Update
    update: async (payload: any) => {
       if (isLive) return supabase!.from(table).update(payload);
       console.warn(`[MOCK] Update simulated for '${table}'`);
       return { data: payload, error: null };
    },
    // Mock Delete
    delete: async () => {
       if (isLive) return supabase!.from(table).delete();
       console.warn(`[MOCK] Delete simulated for '${table}'`);
       return { data: null, error: null };
    }
  })
};