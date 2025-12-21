import * as FileSystem from 'expo-file-system';
import { supabase, hasSupabase } from '../db/supabase';
import { StorageAdapter, StorageResult, StorageFile, UploadProgress } from './types';

export class SupabaseStorageAdapter implements StorageAdapter {
  private bucketName: string;

  constructor(bucketName: string = 'uploads') {
    this.bucketName = bucketName;
  }

  private ensureSupabase() {
    if (!hasSupabase || !supabase) {
      throw new Error('Supabase is not configured');
    }
    return supabase;
  }

  async upload(
    localUri: string,
    remotePath: string,
    options?: {
      onProgress?: (progress: UploadProgress) => void;
      mimeType?: string;
    }
  ): Promise<StorageResult> {
    try {
      const client = this.ensureSupabase();

      // Read file as base64
      const fileData = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to binary
      const binaryData = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));

      // Upload to Supabase
      const { data, error } = await client.storage
        .from(this.bucketName)
        .upload(remotePath, binaryData, {
          contentType: options?.mimeType,
          upsert: true,
        });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Get public URL
      const { data: urlData } = client.storage
        .from(this.bucketName)
        .getPublicUrl(remotePath);

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(localUri);

      return {
        success: true,
        data: {
          name: remotePath.split('/').pop() || remotePath,
          path: data.path,
          size: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
          mimeType: options?.mimeType,
          createdAt: new Date(),
          url: urlData.publicUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async download(
    remotePath: string,
    localUri: string,
    options?: {
      onProgress?: (progress: UploadProgress) => void;
    }
  ): Promise<StorageResult> {
    try {
      const client = this.ensureSupabase();

      // Download file from Supabase
      const { data, error } = await client.storage.from(this.bucketName).download(remotePath);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(data);

      const base64Data = await base64Promise;

      // Write to file system
      await FileSystem.writeAsStringAsync(localUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileInfo = await FileSystem.getInfoAsync(localUri);

      return {
        success: true,
        data: {
          name: remotePath.split('/').pop() || remotePath,
          path: remotePath,
          size: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
          url: localUri,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }

  async getUrl(remotePath: string): Promise<StorageResult<string>> {
    try {
      const client = this.ensureSupabase();

      const { data } = client.storage.from(this.bucketName).getPublicUrl(remotePath);

      return {
        success: true,
        data: data.publicUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get URL',
      };
    }
  }

  async delete(remotePath: string): Promise<StorageResult<void>> {
    try {
      const client = this.ensureSupabase();

      const { error } = await client.storage.from(this.bucketName).remove([remotePath]);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  async list(path: string = ''): Promise<StorageResult<StorageFile[]>> {
    try {
      const client = this.ensureSupabase();

      const { data, error } = await client.storage.from(this.bucketName).list(path);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const files: StorageFile[] = data.map((file) => ({
        name: file.name,
        path: path ? `${path}/${file.name}` : file.name,
        size: file.metadata?.size || 0,
        mimeType: file.metadata?.mimetype,
        createdAt: file.created_at ? new Date(file.created_at) : undefined,
      }));

      return {
        success: true,
        data: files,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'List failed',
      };
    }
  }
}
