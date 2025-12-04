import { create } from 'zustand';
import { supabase, isLive } from '@/services/db';
import { router, Href } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  
  // Actions
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  initialized: false,

  signIn: async (email: string) => {
    set({ isLoading: true });
    
    if (isLive) {
      // 1. Real Supabase Login
      const { error } = await supabase!.auth.signInWithOtp({ email });
      if (error) {
        alert(error.message);
      } else {
        alert('Check your email for the login link!');
      }
    } else {
      // 2. Mock Login (Immediate Access)
      console.log('[MOCK AUTH] Logging in as:', email);
      const mockUser = { id: 'mock-user-123', email };
      
      // Simulate network delay
      await new Promise(r => setTimeout(r, 800));
      
      set({ user: mockUser });
      await SecureStore.setItemAsync('mock-session', JSON.stringify(mockUser));
      
      // Navigate to the Tabs group (Route is '/', NOT '/(tabs)')
      router.replace('/'); 
    }
    
    set({ isLoading: false });
  },

  signOut: async () => {
    if (isLive) {
      await supabase!.auth.signOut();
    } else {
      await SecureStore.deleteItemAsync('mock-session');
    }
    set({ user: null });
    
    // Explicitly navigate to login
    router.replace('/auth/login' as Href);
  },

  checkSession: async () => {
    try {
      if (isLive) {
        // Real Session Check
        const { data } = await supabase!.auth.getSession();
        set({ user: data.session?.user as User | null, initialized: true });
        
        // Listen for Auth Changes
        supabase!.auth.onAuthStateChange((_event, session) => {
          set({ user: session?.user as User | null });
        });
      } else {
        // Mock Session Check
        const saved = await SecureStore.getItemAsync('mock-session');
        if (saved) {
          set({ user: JSON.parse(saved) });
        }
        set({ initialized: true });
      }
    } catch (e) {
      console.error('Session check failed:', e);
      set({ initialized: true });
    }
  }
}));