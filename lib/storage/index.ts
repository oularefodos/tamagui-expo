import { LocalStorageAdapter } from './local';
import { SupabaseStorageAdapter } from './supabase';
import { HybridStorageAdapter } from './hybrid';
import { StorageAdapter, StorageProvider } from './types';

export * from './types';
export * from './local';
export * from './supabase';
export * from './hybrid';

let storageInstance: StorageAdapter | null = null;

/**
 * Create a storage adapter based on the mode
 */
export function createStorageAdapter(
  mode: StorageProvider = 'local',
  bucketName: string = 'uploads'
): StorageAdapter {
  switch (mode) {
    case 'local':
      return new LocalStorageAdapter();
    case 'supabase':
      return new SupabaseStorageAdapter(bucketName);
    case 'hybrid':
      return new HybridStorageAdapter(bucketName);
    default:
      return new LocalStorageAdapter();
  }
}

/**
 * Get the storage instance (singleton)
 */
export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    const mode = (process.env.EXPO_PUBLIC_STORAGE_MODE as StorageProvider) || 'local';
    storageInstance = createStorageAdapter(mode);
  }
  return storageInstance;
}

/**
 * Reset the storage instance (useful for testing)
 */
export function resetStorage(): void {
  storageInstance = null;
}
