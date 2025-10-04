import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

// Define valid permission types for SDK 53
export type PermissionType = 'CAMERA' | 'MEDIA_LIBRARY';

export async function checkPermissions(permissionTypes: PermissionType[]): Promise<boolean> {
    const errors: string[] = [];

    for (const permission of permissionTypes) {
        try {
            if (permission === 'CAMERA') {
                const { status } = await Camera.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    errors.push('Camera permission denied');
                }
            } else if (permission === 'MEDIA_LIBRARY') {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                    errors.push('Media Library permission denied');
                }
            }
        } catch (error) {
            errors.push(`Failed to check ${permission} permission: ${(error as Error).message}`);
        }
    }

    if (errors.length > 0) {
        throw new Error(`Permission check failed: ${errors.join('; ')}`);
    }

    return true;
}