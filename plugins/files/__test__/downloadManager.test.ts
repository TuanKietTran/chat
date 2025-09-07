// plugins/files/__tests__/downloadManager.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { downloadFile, pauseDownload, resumeDownload } from '../downloadManager';

// Use global mocks from jest.setup.js
const mockedFileSystem = jest.mocked(FileSystem);
const mockedAsyncStorage = jest.mocked(AsyncStorage);

describe('downloadManager', () => {
  const url = 'https://example.com/sample.pdf';
  const fileUri = `${FileSystem.documentDirectory}sample.pdf`;
  const mockProgressCallback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadFile', () => {
    it('should successfully download a file', async () => {
      const mockDownloadResumable = mockedFileSystem.createDownloadResumable();
      mockDownloadResumable.downloadAsync.mockResolvedValue({ uri: fileUri, md5: 'mock-md5' });
      mockedAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await downloadFile(url, fileUri, mockProgressCallback);
      expect(result).toBe(fileUri);
      expect(mockedFileSystem.createDownloadResumable).toHaveBeenCalledWith(
        url,
        fileUri,
        {},
        expect.any(Function)
      );
      expect(mockDownloadResumable.downloadAsync).toHaveBeenCalled();
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        `download_${fileUri}`,
        JSON.stringify({ uri: fileUri })
      );
    });

    it('should throw error on download failure', async () => {
      const mockDownloadResumable = mockedFileSystem.createDownloadResumable();
      mockDownloadResumable.downloadAsync.mockResolvedValue(undefined);

      await expect(downloadFile(url, fileUri)).rejects.toThrow('Download failed: No result returned');
    });
  });

  describe('pauseDownload', () => {
    it('should successfully pause a download', async () => {
      const mockDownloadResumable = mockedFileSystem.createDownloadResumable();
      mockDownloadResumable.pauseAsync.mockResolvedValue(undefined);
      mockDownloadResumable.savable.mockReturnValue({ url, fileUri, options: {}, resumeData: 'mockData' });
      mockedAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await pauseDownload(mockDownloadResumable);
      expect(result).toBe(true);
      expect(mockDownloadResumable.pauseAsync).toHaveBeenCalled();
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        `paused_${fileUri}`,
        JSON.stringify({ url, fileUri, options: {}, resumeData: 'mockData' })
      );
    });

    it('should throw error on pause failure', async () => {
      const mockDownloadResumable = mockedFileSystem.createDownloadResumable();
      mockDownloadResumable.pauseAsync.mockRejectedValue(new Error('Pause error'));

      await expect(pauseDownload(mockDownloadResumable)).rejects.toThrow('Failed to pause download: Pause error');
    });
  });

  describe('resumeDownload', () => {
    it('should successfully resume a download', async () => {
      const mockDownloadSnapshot = { url, fileUri, options: {}, resumeData: 'mockData' };
      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockDownloadSnapshot));
      const mockDownloadResumable = mockedFileSystem.createDownloadResumable();
      mockDownloadResumable.resumeAsync.mockResolvedValue({ uri: fileUri, md5: 'mock-md5' });
      mockedAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await resumeDownload(fileUri, mockProgressCallback);
      expect(result).toBe(fileUri);
      expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith(`paused_${fileUri}`);
      expect(mockedFileSystem.createDownloadResumable).toHaveBeenCalledWith(
        url,
        fileUri,
        {},
        expect.any(Function),
        'mockData'
      );
      expect(mockDownloadResumable.resumeAsync).toHaveBeenCalled();
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        `download_${fileUri}`,
        JSON.stringify({ uri: fileUri })
      );
    });

    it('should throw error if no paused download is found', async () => {
      mockedAsyncStorage.getItem.mockResolvedValue(null);

      await expect(resumeDownload(fileUri)).rejects.toThrow('No paused download found');
    });

    it('should throw error on resume failure', async () => {
      const mockDownloadSnapshot = { url, fileUri, options: {}, resumeData: 'mockData' };
      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockDownloadSnapshot));
      const mockDownloadResumable = mockedFileSystem.createDownloadResumable();
      mockDownloadResumable.resumeAsync.mockResolvedValue(undefined);

      await expect(resumeDownload(fileUri)).rejects.toThrow('Resume failed: No result returned');
    });
  });
});