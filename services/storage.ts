import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import {
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  copyAsync
} from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase, isLive } from './db';

// 1. SAFE DIRECTORY ACCESS
const rootDir = (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '';
const MOCK_BUCKET_DIR = rootDir + 'mock-bucket/';

// Ensure mock directory exists (Skip on Web)
async function ensureDir() {
  if (Platform.OS === 'web' || !rootDir) return;
  const dir = await getInfoAsync(MOCK_BUCKET_DIR);
  if (!dir.exists) {
    await makeDirectoryAsync(MOCK_BUCKET_DIR, { intermediates: true });
  }
}

export const fileStorage = {
  upload: async (bucket: string, path: string, uri: string) => {
    try {
      // 1. LIVE MODE (Supabase) - Works on Web & Native
      if (isLive) {
        const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
        
        const { data, error } = await supabase!.storage
          .from(bucket)
          .upload(path, decode(base64), {
            contentType: 'image/jpeg', 
            upsert: true,
          });

        if (error) throw error;
        
        const { data: publicUrl } = supabase!.storage.from(bucket).getPublicUrl(path);
        return { path: publicUrl.publicUrl, error: null };
      }

      // 2. MOCK MODE (Local Filesystem)
      
      // --- WEB FIX: Browsers can't save to disk ---
      if (Platform.OS === 'web') {
        console.log(`[MOCK STORAGE] Web detected. Passing through blob URI: ${uri}`);
        // On web, the picker gives us a blob URL (blob:http://...) which works fine 
        // for displaying immediately. We just return that.
        return { path: uri, error: null };
      }

      // --- NATIVE FIX: Save to Documents Folder ---
      await ensureDir();
      const fileName = path.split('/').pop() ?? `file-${Date.now()}.jpg`;
      const destination = MOCK_BUCKET_DIR + fileName;

      await copyAsync({ from: uri, to: destination });

      console.log(`[MOCK STORAGE] Saved to: ${destination}`);
      return { path: destination, error: null };

    } catch (e: any) {
      console.error('[STORAGE ERROR]', e);
      return { path: null, error: e.message };
    }
  },

  remove: async (bucket: string, path: string) => {
    if (isLive) {
      return supabase!.storage.from(bucket).remove([path]);
    }
    console.log(`[MOCK STORAGE] Would delete: ${path}`);
    return { error: null };
  }
};