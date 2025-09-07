// plugins/expo-file-manager/utils.ts
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

// Define valid permission types for SDK 53
export type PermissionType = 'CAMERA' | 'MEDIA_LIBRARY';

export async function checkPermissions(permissionTypes: PermissionType[]): Promise<boolean> {
  try {
    for (const permission of permissionTypes) {
      if (permission === 'CAMERA') {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Camera permission denied');
        }
      } else if (permission === 'MEDIA_LIBRARY') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Media Library permission denied');
        }
      }
    }
    return true;
  } catch (error) {
    throw new Error(`Permission check failed: ${(error as Error).message}`);
  }
}