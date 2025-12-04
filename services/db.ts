import { MMKV } from 'react-native-mmkv';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// --- 1. SAFE STORAGE INITIALIZATION ---
// Handles the "Expo Go" crash by falling back to Memory
let storage: MMKV | null = null;
try {
  // @ts-ignore: Suppress "MMKV is a type" error
  storage = new MMKV({ id: 'app-db' });
} catch (e) {
  console.warn("⚠️ MMKV failed to load (Running in Expo Go?). Swapping to In-Memory Storage.");
}

// --- 2. IN-MEMORY FALLBACK (For Expo Go) ---
const memoryStore = new Map<string, string>();

// --- 3. MMKV ADAPTER FOR SUPABASE AUTH ---
// Allows Supabase to persist sessions using MMKV
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

// --- 4. SUPABASE CLIENT SETUP ---
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

// Keep the Auth Listener (Do not delete this!)
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const isLive = !!supabase;

// --- 5. HYBRID DATA ADAPTER (The "Magic" Part) ---
// This mimics the Supabase API so your UI code works Offline & Online.

// Internal helper to read/write raw JSON
const localDb = {
  get: (key: string) => {
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
    // READ
    select: async () => {
      if (isLive) return supabase!.from(table).select('*');
      
      console.log(`[MOCK] Reading '${table}'`);
      return { data: localDb.get(table), error: null };
    },
    
    // CREATE
    insert: async (payload: any) => {
      if (isLive) return supabase!.from(table).insert(payload).select();
      
      const current = localDb.get(table);
      // Generate a fake ID for the mock item
      const newItem = { id: Math.random().toString(36).substring(7), ...payload };
      localDb.set(table, [...current, newItem]);
      
      console.log(`[MOCK] Saved to '${table}'`);
      return { data: [newItem], error: null };
    },
    
    // UPDATE
    update: async (payload: any) => {
      if (isLive) return supabase!.from(table).update(payload);
      
      // Mock update needs an .eq() chain, but for simple prototypes we just return success
      // Real implementation would require a query builder state machine
      console.warn(`[MOCK] Update simulated for '${table}'`);
      return { 
        eq: (col: string, val: any) => {
           // Basic Mock Update Logic (Optional)
           const current = localDb.get(table);
           const updated = current.map((item: any) => item[col] === val ? { ...item, ...payload } : item);
           localDb.set(table, updated);
           return { data: payload, error: null };
        }
      };
    },
    
    // DELETE
    delete: async () => {
      if (isLive) return supabase!.from(table).delete();
      
      return {
        eq: (col: string, val: any) => {
           const current = localDb.get(table);
           const filtered = current.filter((item: any) => item[col] !== val);
           localDb.set(table, filtered);
           return { data: null, error: null };
        }
      };
    }
  })
};