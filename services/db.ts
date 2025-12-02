import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import { MMKV } from "react-native-mmkv";

// --- 1. SAFE STORAGE INITIALIZATION ---
let storage: MMKV | null = null;
try {
    // @ts-ignore: Suppress "MMKV is a type" error
    storage = new MMKV({ id: "app-db" });
} catch (e) {
    console.warn(
        "⚠️ MMKV failed to load (Running in Expo Go?). Data will not persist."
    );
}

// --- 2. MMKV ADAPTER FOR SUPABASE ---
// This tells Supabase: "Use MMKV, not AsyncStorage"
const mmkvSupabaseAdapter = {
    getItem: (key: string) => {
        const val = storage?.getString(key);
        return val ?? null;
    },
    setItem: (key: string, value: string) => {
        storage?.set(key, value);
    },
    removeItem: (key: string) => {
        // FIX: Cast to 'any' to bypass the TS error
        // The .delete() method exists at runtime, but TS is confused.
        (storage as any)?.delete(key);
    },
};

// --- 3. SUPABASE SETUP ---
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
    supabaseUrl && supabaseKey
        ? createClient(supabaseUrl, supabaseKey, {
              auth: {
                  storage: mmkvSupabaseAdapter, // <--- CRITICAL FIX
                  autoRefreshToken: true,
                  persistSession: true,
                  detectSessionInUrl: false,
              },
          })
        : null;

// Optional: Auto-refresh tokens when app comes to foreground
if (supabase) {
    AppState.addEventListener("change", (state) => {
        if (state === "active") supabase.auth.startAutoRefresh();
        else supabase.auth.stopAutoRefresh();
    });
}

export const isLive = !!supabase;

// --- 4. HYBRID ADAPTER (Data Layer) ---
// Helper for local JSON parsing
const localDb = {
    get: (key: string) => {
        const val = storage?.getString(key);
        return val ? JSON.parse(val) : [];
    },
    set: (key: string, value: any) => {
        storage?.set(key, JSON.stringify(value));
    },
};

export const db = {
    from: (table: string) => ({
        select: async () => {
            if (isLive) return supabase!.from(table).select("*");
            console.log(`[MOCK] Reading '${table}' from MMKV`);
            return { data: localDb.get(table), error: null };
        },
        insert: async (payload: any) => {
            if (isLive) return supabase!.from(table).insert(payload).select();

            const current = localDb.get(table);
            const newItem = {
                id: Math.random().toString(36).substring(7),
                ...payload,
            };
            localDb.set(table, [...current, newItem]);
            console.log(`[MOCK] Saved to '${table}' in MMKV`);
            return { data: [newItem], error: null };
        },
        // Add update/delete stubs as needed...
    }),
};
