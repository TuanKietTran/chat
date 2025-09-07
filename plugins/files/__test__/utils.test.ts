// plugins/files/__tests__/utils.test.ts
import { describe, it, expect, jest } from '@jest/globals';
import { PermissionStatus, PermissionResponse } from 'expo-modules-core';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { checkPermissions } from '../utils';

// Use global mocks from jest.setup.js
const mockedCamera = jest.mocked(Camera);
const mockedMediaLibrary = jest.mocked(MediaLibrary);

describe('utils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkPermissions', () => {
    it('should grant CAMERA permission', async () => {
      const permissionResponse: PermissionResponse = {
        status: PermissionStatus.GRANTED,
        expires: 'never',
        granted: true,
        canAskAgain: true,
      };
      mockedCamera.requestCameraPermissionsAsync.mockResolvedValue(permissionResponse);

      const result = await checkPermissions(['CAMERA']);
      expect(result).toBe(true);
      expect(mockedCamera.requestCameraPermissionsAsync).toHaveBeenCalled();
    });

    it('should grant MEDIA_LIBRARY permission', async () => {
      const permissionResponse: PermissionResponse = {
        status: PermissionStatus.GRANTED,
        expires: 'never',
        granted: true,
        canAskAgain: true,
      };
      mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue(permissionResponse);

      const result = await checkPermissions(['MEDIA_LIBRARY']);
      expect(result).toBe(true);
      expect(mockedMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should grant multiple permissions', async () => {
      const permissionResponse: PermissionResponse = {
        status: PermissionStatus.GRANTED,
        expires: 'never',
        granted: true,
        canAskAgain: true,
      };
      mockedCamera.requestCameraPermissionsAsync.mockResolvedValue(permissionResponse);
      mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue(permissionResponse);

      const result = await checkPermissions(['CAMERA', 'MEDIA_LIBRARY']);
      expect(result).toBe(true);
      expect(mockedCamera.requestCameraPermissionsAsync).toHaveBeenCalled();
      expect(mockedMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should throw error if CAMERA permission is denied', async () => {
      const permissionResponse: PermissionResponse = {
        status: PermissionStatus.DENIED,
        expires: 'never',
        granted: false,
        canAskAgain: true,
      };
      mockedCamera.requestCameraPermissionsAsync.mockResolvedValue(permissionResponse);

      await expect(checkPermissions(['CAMERA'])).rejects.toThrow('Camera permission denied');
    });

    it('should throw error if MEDIA_LIBRARY permission is denied', async () => {
      const permissionResponse: PermissionResponse = {
        status: PermissionStatus.DENIED,
        expires: 'never',
        granted: false,
        canAskAgain: true,
      };
      mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue(permissionResponse);

      await expect(checkPermissions(['MEDIA_LIBRARY'])).rejects.toThrow('Media Library permission denied');
    });

    it('should throw error on permission check failure', async () => {
      mockedCamera.requestCameraPermissionsAsync.mockRejectedValue(new Error('Permission error'));

      await expect(checkPermissions(['CAMERA'])).rejects.toThrow('Permission check failed: Permission error');
    });
  });
});