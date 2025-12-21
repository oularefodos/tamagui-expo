import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { getStorage, UploadProgress, StorageFile } from '../lib/storage';

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Pick an image from the device library
   */
  const pickImage = useCallback(async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access media library was denied');
        return null;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick image';
      setError(errorMessage);
      console.error('Failed to pick image:', err);
      return null;
    }
  }, []);

  /**
   * Take a photo with the camera
   */
  const takePhoto = useCallback(async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access camera was denied');
        return null;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to take photo';
      setError(errorMessage);
      console.error('Failed to take photo:', err);
      return null;
    }
  }, []);

  /**
   * Upload an image to storage
   */
  const uploadImage = useCallback(
    async (imageUri: string, folder: string = 'images'): Promise<StorageFile | null> => {
      try {
        setUploading(true);
        setError(null);
        setProgress(0);

        const storage = getStorage();

        // Generate unique filename
        const timestamp = Date.now();
        const extension = imageUri.split('.').pop() || 'jpg';
        const fileName = `${timestamp}.${extension}`;
        const remotePath = `${folder}/${fileName}`;

        // Upload with progress tracking
        const result = await storage.upload(imageUri, remotePath, {
          mimeType: `image/${extension}`,
          onProgress: (prog: UploadProgress) => {
            setProgress(prog.percentage);
          },
        });

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        return result.data || null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
        setError(errorMessage);
        console.error('Failed to upload image:', err);
        return null;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    []
  );

  /**
   * Pick and upload an image in one step
   */
  const pickAndUpload = useCallback(
    async (folder: string = 'images'): Promise<StorageFile | null> => {
      const asset = await pickImage();
      if (!asset) {
        return null;
      }

      return uploadImage(asset.uri, folder);
    },
    [pickImage, uploadImage]
  );

  /**
   * Take a photo and upload in one step
   */
  const photoAndUpload = useCallback(
    async (folder: string = 'images'): Promise<StorageFile | null> => {
      const asset = await takePhoto();
      if (!asset) {
        return null;
      }

      return uploadImage(asset.uri, folder);
    },
    [takePhoto, uploadImage]
  );

  /**
   * Save image to device media library
   */
  const saveToLibrary = useCallback(async (imageUri: string): Promise<boolean> => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to save to media library was denied');
        return false;
      }

      await MediaLibrary.saveToLibraryAsync(imageUri);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save to library';
      setError(errorMessage);
      console.error('Failed to save to library:', err);
      return false;
    }
  }, []);

  return {
    uploading,
    progress,
    error,
    pickImage,
    takePhoto,
    uploadImage,
    pickAndUpload,
    photoAndUpload,
    saveToLibrary,
  };
}
