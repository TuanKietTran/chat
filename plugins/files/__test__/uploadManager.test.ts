// plugins/files/__tests__/uploadManager.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as FileSystem from 'expo-file-system';
import * as tus from 'tus-js-client';
import { uploadFile } from '../uploadManager';

// Use global mocks from jest.setup.js
const mockedFileSystem = jest.mocked(FileSystem);
const mockedTus = jest.mocked(tus);

describe('uploadManager', () => {
  const fileUri = `${FileSystem.documentDirectory}test.txt`;
  const endpoint = 'https://tus-server.com/files/';
  const mockProgressCallback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should successfully upload a file', async () => {
      mockedFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: fileUri,
        size: 100,
        isDirectory: false,
        modificationTime: 1234567890,
      });
      mockedFileSystem.readAsStringAsync.mockResolvedValue('SGVsbG8sIFdvcmxkIQ=='); // Base64 for "Hello, World!"
      const mockUpload = new mockedTus.Upload(new Blob(), { endpoint });
      mockUpload.findPreviousUploads.mockResolvedValue([]);
      mockUpload.start.mockResolvedValue();

      const result = await uploadFile(fileUri, endpoint, {}, mockProgressCallback);
      expect(result).toBe('Upload complete');
      expect(mockedFileSystem.getInfoAsync).toHaveBeenCalledWith(fileUri);
      expect(mockedFileSystem.readAsStringAsync).toHaveBeenCalledWith(fileUri, { encoding: 'base64' });
      expect(mockedTus.Upload).toHaveBeenCalledWith(expect.any(Blob), expect.any(Object));
      expect(mockUpload.findPreviousUploads).toHaveBeenCalled();
      expect(mockUpload.start).toHaveBeenCalled();
    });

    it('should resume upload from previous upload', async () => {
      mockedFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: fileUri,
        size: 100,
        isDirectory: false,
        modificationTime: 1234567890,
      });
      mockedFileSystem.readAsStringAsync.mockResolvedValue('SGVsbG8sIFdvcmxkIQ==');
      const mockUpload = new mockedTus.Upload(new Blob(), { endpoint });
      mockUpload.findPreviousUploads.mockResolvedValue([{ id: 'prev-upload' }]);
      mockUpload.resumeFromPreviousUpload.mockResolvedValue();
      mockUpload.start.mockResolvedValue();

      const result = await uploadFile(fileUri, endpoint);
      expect(result).toBe('Upload complete');
      expect(mockUpload.findPreviousUploads).toHaveBeenCalled();
      expect(mockUpload.resumeFromPreviousUpload).toHaveBeenCalledWith({ id: 'prev-upload' });
      expect(mockUpload.start).toHaveBeenCalled();
    });

    it('should throw error if file does not exist', async () => {
      mockedFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        uri: fileUri,
        isDirectory: false,
      });

      await expect(uploadFile(fileUri, endpoint)).rejects.toThrow('File does not exist');
    });

    it('should throw error on upload failure', async () => {
      mockedFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: fileUri,
        size: 100,
        isDirectory: false,
        modificationTime: 1234567890,
      });
      mockedFileSystem.readAsStringAsync.mockResolvedValue('SGVsbG8sIFdvcmxkIQ==');
      const mockUpload = new mockedTus.Upload(new Blob(), { endpoint });
      mockUpload.findPreviousUploads.mockResolvedValue([]);
      mockUpload.start.mockRejectedValue(new Error('Upload error'));

      await expect(uploadFile(fileUri, endpoint)).rejects.toThrow('Upload failed: Upload error');
    });
  });
});