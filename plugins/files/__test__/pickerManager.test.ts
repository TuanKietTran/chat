// plugins/files/__tests__/pickerManager.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { pickDocument, pickMedia, saveToDownloads, MediaPickerOptions } from '../pickerManager';
import { checkPermissions } from '../utils';

// Mock Platform globally
jest.mock('react-native', () => ({
  Platform: {
    OS: 'unknown', // Default value, will be overridden in beforeEach
    select: jest.fn(),
  },
}));

// Use global mocks from jest.setup.js
const mockedDocumentPicker = jest.mocked(DocumentPicker);
const mockedImagePicker = jest.mocked(ImagePicker);
const mockedMediaLibrary = jest.mocked(MediaLibrary);
const mockedFileSystem = jest.mocked(FileSystem);
const mockedCheckPermissions = jest.mocked(checkPermissions);

describe('pickerManager', () => {
  const fileUri = `${FileSystem.documentDirectory}test.txt`;
  const filename = 'downloaded_file.txt';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pickDocument', () => {
    it('should successfully pick a document', async () => {
      mockedCheckPermissions.mockResolvedValue(true);
      mockedDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: fileUri, name: 'test.txt', mimeType: 'text/plain', size: 1024 }],
      });

      const result = await pickDocument();
      expect(result).toBe(fileUri);
      expect(mockedCheckPermissions).toHaveBeenCalledWith(['MEDIA_LIBRARY']);
      expect(mockedDocumentPicker.getDocumentAsync).toHaveBeenCalledWith({
        type: '*/*',
        copyToCacheDirectory: true,
      });
    });

    it('should throw error when picking is canceled', async () => {
      mockedCheckPermissions.mockResolvedValue(true);
      mockedDocumentPicker.getDocumentAsync.mockResolvedValue({ canceled: true, assets: null });

      await expect(pickDocument()).rejects.toThrow('Document picking canceled');
    });

    it('should throw error when permission is denied', async () => {
      mockedCheckPermissions.mockRejectedValue(new Error('Permission denied'));

      await expect(pickDocument()).rejects.toThrow('Failed to pick document: Permission denied');
    });
  });

  describe('pickMedia', () => {
    const options: MediaPickerOptions = { mediaTypes: ImagePicker.MediaTypeOptions.Images };

    it('should successfully pick media', async () => {
      mockedCheckPermissions.mockResolvedValue(true);
      mockedImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: fileUri, width: 100, height: 100, fileName: 'test.jpg', type: 'image' }],
      });

      const result = await pickMedia(options);
      expect(result).toBe(fileUri);
      expect(mockedCheckPermissions).toHaveBeenCalledWith(['MEDIA_LIBRARY', 'CAMERA']);
      expect(mockedImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
    });

    it('should throw error when picking is canceled', async () => {
      mockedCheckPermissions.mockResolvedValue(true);
      mockedImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });

      await expect(pickMedia(options)).rejects.toThrow('Media picking canceled');
    });

    it('should throw error when permission is denied', async () => {
      mockedCheckPermissions.mockRejectedValue(new Error('Permission denied'));

      await expect(pickMedia(options)).rejects.toThrow('Failed to pick media: Permission denied');
    });
  });

  describe('saveToDownloads', () => {
    describe('Android', () => {
      beforeEach(() => {
        jest.requireMock('react-native').Platform.OS = 'android'; // Override Platform.OS for Android tests
      });

      it('should successfully save file to downloads', async () => {
        mockedCheckPermissions.mockResolvedValue(true);
        mockedFileSystem.readAsStringAsync.mockResolvedValue('SGVsbG8sIFdvcmxkIQ==');
        mockedFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync.mockResolvedValue({
          granted: true,
          directoryUri: 'file://mock/downloads/',
        });
        mockedFileSystem.StorageAccessFramework.createFileAsync.mockResolvedValue(fileUri);
        mockedFileSystem.writeAsStringAsync.mockResolvedValue(undefined);

        const result = await saveToDownloads(fileUri, filename);
        expect(result).toBe(fileUri);
        expect(mockedCheckPermissions).toHaveBeenCalledWith(['MEDIA_LIBRARY']);
        expect(mockedFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync).toHaveBeenCalled();
        expect(mockedFileSystem.StorageAccessFramework.createFileAsync).toHaveBeenCalledWith(
          'file://mock/downloads/',
          filename,
          'application/octet-stream'
        );
        expect(mockedFileSystem.writeAsStringAsync).toHaveBeenCalledWith(
          fileUri,
          'SGVsbG8sIFdvcmxkIQ==',
          { encoding: 'base64' }
        );
      });

      it('should throw error when directory permission is denied', async () => {
        mockedCheckPermissions.mockResolvedValue(true);
        mockedFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync.mockResolvedValue({
          granted: false,
        });

        await expect(saveToDownloads(fileUri, filename)).rejects.toThrow('Directory permission denied');
      });
    });

    describe('iOS', () => {
      beforeEach(() => {
        jest.requireMock('react-native').Platform.OS = 'ios'; // Override Platform.OS for iOS tests
      });

      it('should successfully save file to Downloads album', async () => {
        mockedCheckPermissions.mockResolvedValue(true);
        mockedMediaLibrary.createAssetAsync.mockResolvedValue({
          id: 'asset-id',
          filename: filename,
          uri: fileUri,
          mediaType: 'photo',
          width: 0,
          height: 0,
          creationTime: 1234567890,
          modificationTime: 1234567890,
          duration: 0,
        });
        mockedMediaLibrary.getAlbumAsync.mockResolvedValue(null as any);

        await saveToDownloads(fileUri, filename); // No result to expect, as it returns void
        expect(mockedCheckPermissions).toHaveBeenCalledWith(['MEDIA_LIBRARY']);
        expect(mockedMediaLibrary.createAssetAsync).toHaveBeenCalledWith(fileUri);
        expect(mockedMediaLibrary.getAlbumAsync).toHaveBeenCalledWith('Download');
        expect(mockedMediaLibrary.createAlbumAsync).toHaveBeenCalledWith(
          'Download',
          expect.any(Object),
          false
        );
      });

      it('should add file to existing Downloads album', async () => {
        mockedCheckPermissions.mockResolvedValue(true);
        mockedMediaLibrary.createAssetAsync.mockResolvedValue({
          id: 'asset-id',
          filename: filename,
          uri: fileUri,
          mediaType: 'photo',
          width: 0,
          height: 0,
          creationTime: 1234567890,
          modificationTime: 1234567890,
          duration: 0,
        });
        mockedMediaLibrary.getAlbumAsync.mockResolvedValue({
          id: 'album-id',
          title: 'Download',
          assetCount: 0,
          startTime: 0,
          endTime: 0,
        });

        await saveToDownloads(fileUri, filename); // No result to expect, as it returns void
        expect(mockedCheckPermissions).toHaveBeenCalledWith(['MEDIA_LIBRARY']);
        expect(mockedMediaLibrary.addAssetsToAlbumAsync).toHaveBeenCalledWith(
          [expect.objectContaining({ uri: fileUri })],
          { id: 'album-id', title: 'Download', assetCount: 0, startTime: 0, endTime: 0 },
          false
        );
      });

      it('should throw error when permission is denied', async () => {
        mockedCheckPermissions.mockRejectedValue(new Error('Permission denied'));

        await expect(saveToDownloads(fileUri, filename)).rejects.toThrow('Failed to save to downloads: Permission denied');
      });
    });
  });
});