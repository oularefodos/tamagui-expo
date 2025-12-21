export interface StorageFile {
  name: string;
  path: string;
  size: number;
  mimeType?: string;
  createdAt?: Date;
  url?: string;
}

export interface StorageResult<T = StorageFile> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface StorageAdapter {
  /**
   * Upload a file to storage
   */
  upload(
    localUri: string,
    remotePath: string,
    options?: {
      onProgress?: (progress: UploadProgress) => void;
      mimeType?: string;
    }
  ): Promise<StorageResult>;

  /**
   * Download a file from storage
   */
  download(
    remotePath: string,
    localUri: string,
    options?: {
      onProgress?: (progress: UploadProgress) => void;
    }
  ): Promise<StorageResult>;

  /**
   * Get public URL for a file
   */
  getUrl(remotePath: string): Promise<StorageResult<string>>;

  /**
   * Delete a file from storage
   */
  delete(remotePath: string): Promise<StorageResult<void>>;

  /**
   * List files in a directory
   */
  list(path?: string): Promise<StorageResult<StorageFile[]>>;
}

export type StorageProvider = 'local' | 'supabase' | 'hybrid';
