import * as FileSystem from 'expo-file-system';
import { StorageAdapter, StorageResult, StorageFile, UploadProgress } from './types';

export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;

  constructor() {
    this.baseDir = `${FileSystem.documentDirectory}uploads/`;
    this.ensureBaseDir();
  }

  private async ensureBaseDir(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.baseDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.baseDir, { intermediates: true });
      }
    } catch (error) {
      console.error('Failed to create base directory:', error);
    }
  }

  private getFullPath(remotePath: string): string {
    return `${this.baseDir}${remotePath}`;
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
      const fullPath = this.getFullPath(remotePath);
      const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));

      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      }

      // Copy file to local storage
      await FileSystem.copyAsync({
        from: localUri,
        to: fullPath,
      });

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(fullPath);

      return {
        success: true,
        data: {
          name: remotePath.split('/').pop() || remotePath,
          path: remotePath,
          size: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
          mimeType: options?.mimeType,
          createdAt: new Date(),
          url: fullPath,
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
      const fullPath = this.getFullPath(remotePath);
      const fileInfo = await FileSystem.getInfoAsync(fullPath);

      if (!fileInfo.exists) {
        return {
          success: false,
          error: 'File not found',
        };
      }

      // Copy file to destination
      await FileSystem.copyAsync({
        from: fullPath,
        to: localUri,
      });

      const destInfo = await FileSystem.getInfoAsync(localUri);

      return {
        success: true,
        data: {
          name: remotePath.split('/').pop() || remotePath,
          path: remotePath,
          size: destInfo.exists && 'size' in destInfo ? destInfo.size : 0,
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
      const fullPath = this.getFullPath(remotePath);
      const fileInfo = await FileSystem.getInfoAsync(fullPath);

      if (!fileInfo.exists) {
        return {
          success: false,
          error: 'File not found',
        };
      }

      return {
        success: true,
        data: fullPath,
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
      const fullPath = this.getFullPath(remotePath);
      const fileInfo = await FileSystem.getInfoAsync(fullPath);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fullPath);
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
      const fullPath = path ? this.getFullPath(path) : this.baseDir;
      const dirInfo = await FileSystem.getInfoAsync(fullPath);

      if (!dirInfo.exists) {
        return {
          success: true,
          data: [],
        };
      }

      const files = await FileSystem.readDirectoryAsync(fullPath);
      const fileList: StorageFile[] = [];

      for (const file of files) {
        const filePath = `${fullPath}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.exists) {
          const relativePath = path ? `${path}/${file}` : file;
          fileList.push({
            name: file,
            path: relativePath,
            size: 'size' in fileInfo ? fileInfo.size : 0,
            createdAt:
              'modificationTime' in fileInfo
                ? new Date(fileInfo.modificationTime * 1000)
                : undefined,
            url: filePath,
          });
        }
      }

      return {
        success: true,
        data: fileList,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'List failed',
      };
    }
  }
}
