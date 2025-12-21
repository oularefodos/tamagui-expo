import { hasSupabase } from '../db/supabase';
import { LocalStorageAdapter } from './local';
import { SupabaseStorageAdapter } from './supabase';
import { StorageAdapter, StorageResult, StorageFile, UploadProgress } from './types';

/**
 * Hybrid storage adapter that uses local storage first,
 * then syncs to cloud storage in the background
 */
export class HybridStorageAdapter implements StorageAdapter {
  private localAdapter: LocalStorageAdapter;
  private cloudAdapter: SupabaseStorageAdapter | null;

  constructor(bucketName: string = 'uploads') {
    this.localAdapter = new LocalStorageAdapter();
    this.cloudAdapter = hasSupabase ? new SupabaseStorageAdapter(bucketName) : null;
  }

  async upload(
    localUri: string,
    remotePath: string,
    options?: {
      onProgress?: (progress: UploadProgress) => void;
      mimeType?: string;
    }
  ): Promise<StorageResult> {
    // Upload to local storage first (fast)
    const localResult = await this.localAdapter.upload(localUri, remotePath, options);

    if (!localResult.success) {
      return localResult;
    }

    // Sync to cloud in background (non-blocking)
    if (this.cloudAdapter) {
      this.cloudAdapter.upload(localUri, remotePath, {
        mimeType: options?.mimeType,
      }).catch((error) => {
        console.warn('Background cloud upload failed:', error);
      });
    }

    return localResult;
  }

  async download(
    remotePath: string,
    localUri: string,
    options?: {
      onProgress?: (progress: UploadProgress) => void;
    }
  ): Promise<StorageResult> {
    // Try local storage first
    const localResult = await this.localAdapter.download(remotePath, localUri, options);

    if (localResult.success) {
      return localResult;
    }

    // Fallback to cloud storage
    if (this.cloudAdapter) {
      const cloudResult = await this.cloudAdapter.download(remotePath, localUri, options);

      // If cloud download succeeds, cache it locally
      if (cloudResult.success) {
        await this.localAdapter.upload(localUri, remotePath).catch((error) => {
          console.warn('Failed to cache downloaded file:', error);
        });
      }

      return cloudResult;
    }

    return localResult;
  }

  async getUrl(remotePath: string): Promise<StorageResult<string>> {
    // Try cloud URL first (public)
    if (this.cloudAdapter) {
      const cloudResult = await this.cloudAdapter.getUrl(remotePath);
      if (cloudResult.success) {
        return cloudResult;
      }
    }

    // Fallback to local URL
    return this.localAdapter.getUrl(remotePath);
  }

  async delete(remotePath: string): Promise<StorageResult<void>> {
    // Delete from local storage
    const localResult = await this.localAdapter.delete(remotePath);

    // Delete from cloud storage in background
    if (this.cloudAdapter) {
      this.cloudAdapter.delete(remotePath).catch((error) => {
        console.warn('Background cloud delete failed:', error);
      });
    }

    return localResult;
  }

  async list(path?: string): Promise<StorageResult<StorageFile[]>> {
    // Try cloud list first (more authoritative)
    if (this.cloudAdapter) {
      const cloudResult = await this.cloudAdapter.list(path);
      if (cloudResult.success) {
        return cloudResult;
      }
    }

    // Fallback to local list
    return this.localAdapter.list(path);
  }

  /**
   * Sync local files to cloud storage
   */
  async syncToCloud(path?: string): Promise<{ synced: number; failed: number }> {
    if (!this.cloudAdapter) {
      return { synced: 0, failed: 0 };
    }

    const localFiles = await this.localAdapter.list(path);
    if (!localFiles.success || !localFiles.data) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const file of localFiles.data) {
      try {
        if (file.url) {
          await this.cloudAdapter.upload(file.url, file.path);
          synced++;
        }
      } catch (error) {
        console.warn(`Failed to sync ${file.path}:`, error);
        failed++;
      }
    }

    return { synced, failed };
  }
}
