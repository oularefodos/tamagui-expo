import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// --- 1. SUPABASE CLIENT SETUP ---
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Simple adapter for Supabase Auth to work with AsyncStorage
const asyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: asyncStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }) 
  : null;

// Auth Listener
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const isLive = !!supabase;

// --- 2. HYBRID DATA ADAPTER (AsyncStorage Version) ---
// works Offline, Online, AND persists in Expo Go.

// Helper to read/write JSON to AsyncStorage
const localDb = {
  get: async (key: string) => {
    try {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  },
  set: async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Save failed", e);
    }
  }
};

export const db = {
  from: (table: string) => ({
    // READ
    select: async () => {
      if (isLive) return supabase!.from(table).select('*');
      
      console.log(`[MOCK] Reading '${table}'`);
      const data = await localDb.get(table);
      return { data, error: null };
    },
    
    // CREATE
    insert: async (payload: any) => {
      if (isLive) return supabase!.from(table).insert(payload).select();
      
      const current = await localDb.get(table);
      const newItem = { id: Math.random().toString(36).substring(7), ...payload };
      await localDb.set(table, [...current, newItem]);
      
      console.log(`[MOCK] Saved to '${table}'`);
      // Return data in an array to match Supabase
      return { data: [newItem], error: null };
    },
    
    // UPDATE
    // We return an object with .eq() immediately (Synchronously)
    update: (payload: any) => {
      if (isLive) return supabase!.from(table).update(payload);
      
      console.warn(`[MOCK] Update simulated for '${table}'`);
      
      return { 
        eq: async (col: string, val: any) => {
           const current = await localDb.get(table);
           const updated = current.map((item: any) => item[col] === val ? { ...item, ...payload } : item);
           await localDb.set(table, updated);
           return { data: payload, error: null };
        }
      };
    },
    
    // DELETE
    // We return an object with .eq() immediately (Synchronously)
    delete: () => {
      if (isLive) return supabase!.from(table).delete();
      
      return {
        eq: async (col: string, val: any) => {
           const current = await localDb.get(table);
           const filtered = current.filter((item: any) => item[col] !== val);
           await localDb.set(table, filtered);
           return { data: null, error: null };
        }
      };
    }
  })
};