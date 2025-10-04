import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  downloadFile,
  pauseDownload,
  resumeDownload,
} from "../downloadManager";

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  documentDirectory: "file://mock/documentDirectory/",
  EncodingType: {
    UTF8: "utf8",
    Base64: "base64",
  },
  getInfoAsync: jest.fn(() =>
    Promise.resolve({
      exists: true,
      uri: "file://mock/test.txt",
      size: 100,
      isDirectory: false,
      modificationTime: 1234567890,
    }),
  ),
  readAsStringAsync: jest.fn(() => Promise.resolve("SGVsbG8sIFdvcmxkIQ==")),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  createDownloadResumable: jest.fn(() => ({
    downloadAsync: jest.fn(() =>
      Promise.resolve({
        uri: "file://mock/downloaded.pdf",
        md5: "mock-md5",
      }),
    ),
    pauseAsync: jest.fn(() => Promise.resolve()),
    resumeAsync: jest.fn(() =>
      Promise.resolve({
        uri: "file://mock/downloaded.pdf",
        md5: "mock-md5",
      }),
    ),
    savable: jest.fn(() => ({
      url: "",
      fileUri: "",
      options: {},
      resumeData: "",
    })),
    fileUri: "file://mock/downloaded.pdf",
  })),
  StorageAccessFramework: {
    requestDirectoryPermissionsAsync: jest.fn(() =>
      Promise.resolve({
        granted: true,
        directoryUri: "file://mock/downloads/",
      }),
    ),
    createFileAsync: jest.fn(() => Promise.resolve("file://mock/file.txt")),
  },
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage");

const mockedFileSystem = jest.mocked(FileSystem);
const mockedAsyncStorage = jest.mocked(AsyncStorage);

describe("downloadManager", () => {
  const url = "https://example.com/sample.pdf";
  const fileUri = `${FileSystem.documentDirectory}sample.pdf`;
  const mockProgressCallback = jest.fn();

  // Get references to the mock functions from the FileSystem mock
  let mockDownloadResumable: any;
  let mockDownloadAsync: jest.MockedFunction<any>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockPauseAsync: jest.MockedFunction<any>;
  let mockResumeAsync: jest.MockedFunction<any>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockSavable: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the mock implementations
    mockDownloadResumable = {
      downloadAsync: jest.fn(() =>
        Promise.resolve({
          uri: fileUri,
          md5: "mock-md5",
        }),
      ),
      pauseAsync: jest.fn(() => Promise.resolve()),
      resumeAsync: jest.fn(() =>
        Promise.resolve({
          uri: fileUri,
          md5: "mock-md5",
        }),
      ),
      savable: jest.fn(() => ({
        url,
        fileUri,
        options: {},
        resumeData: "mockData",
      })),
      fileUri: fileUri,
    };

    // Store references to the mock functions
    mockDownloadAsync = mockDownloadResumable.downloadAsync;
    mockPauseAsync = mockDownloadResumable.pauseAsync;
    mockResumeAsync = mockDownloadResumable.resumeAsync;
    mockSavable = mockDownloadResumable.savable;

    // Make createDownloadResumable return our mock object
    (
      mockedFileSystem.createDownloadResumable as jest.MockedFunction<any>
    ).mockReturnValue(mockDownloadResumable);
  });

  describe("downloadFile", () => {
    it("should successfully download a file", async () => {
      const mockResult = {
        uri: fileUri,
        md5: "mock-md5",
      };
      mockDownloadAsync.mockResolvedValue(mockResult);
      (
        mockedAsyncStorage.setItem as jest.MockedFunction<any>
      ).mockResolvedValue(undefined);

      const result = await downloadFile(url, fileUri, mockProgressCallback);

      expect(result).toBe(fileUri);
      expect(mockedFileSystem.createDownloadResumable).toHaveBeenCalledWith(
        url,
        fileUri,
        {},
        mockProgressCallback,
      );
      expect(mockDownloadAsync).toHaveBeenCalledTimes(1);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        `download_${fileUri}`,
        JSON.stringify({ uri: fileUri }),
      );
    });

    it("should successfully download a file without callback", async () => {
      const mockResult = {
        uri: fileUri,
        md5: "mock-md5",
      };
      mockDownloadAsync.mockResolvedValue(mockResult);
      (
        mockedAsyncStorage.setItem as jest.MockedFunction<any>
      ).mockResolvedValue(undefined);

      const result = await downloadFile(url, fileUri);

      expect(result).toBe(fileUri);
      expect(mockedFileSystem.createDownloadResumable).toHaveBeenCalledWith(
        url,
        fileUri,
        {},
        undefined,
      );
      expect(mockDownloadAsync).toHaveBeenCalledTimes(1);
    });

    it("should throw error when downloadAsync returns null", async () => {
      mockDownloadAsync.mockResolvedValue(null);

      await expect(downloadFile(url, fileUri)).rejects.toThrow(
        "Download failed: No result returned",
      );
      expect(mockDownloadAsync).toHaveBeenCalledTimes(1);
      expect(mockedAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it("should throw error on download failure", async () => {
      mockDownloadAsync.mockRejectedValue(new Error("Network error"));

      await expect(downloadFile(url, fileUri)).rejects.toThrow(
        "Download failed: Network error",
      );
      expect(mockDownloadAsync).toHaveBeenCalledTimes(1);
      expect(mockedAsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe("pauseDownload", () => {
    it("should successfully pause a download", async () => {
      const mockSnapshot = {
        url,
        fileUri,
        options: {},
        resumeData: "mockData",
      };

      // Create a fresh mock for this test
      const testDownloadResumable = {
        pauseAsync: jest.fn().mockResolvedValue(undefined as never),
        savable: jest.fn().mockReturnValue(mockSnapshot),
        fileUri: fileUri,
      };

      (
        mockedAsyncStorage.setItem as jest.MockedFunction<any>
      ).mockResolvedValue(undefined);

      const result = await pauseDownload(testDownloadResumable as any);

      expect(result).toBe(true);
      expect(testDownloadResumable.pauseAsync).toHaveBeenCalledTimes(1);
      expect(testDownloadResumable.savable).toHaveBeenCalledTimes(1);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        `paused_${fileUri}`,
        JSON.stringify(mockSnapshot),
      );
    });

    it("should throw error on pause failure", async () => {
      const testDownloadResumable = {
        pauseAsync: jest
          .fn()
          .mockRejectedValue(new Error("Pause error") as never),
        savable: jest.fn(),
        fileUri: fileUri,
      };

      await expect(pauseDownload(testDownloadResumable as any)).rejects.toThrow(
        "Failed to pause download: Pause error",
      );
      expect(testDownloadResumable.pauseAsync).toHaveBeenCalledTimes(1);
      expect(testDownloadResumable.savable).not.toHaveBeenCalled();
      expect(mockedAsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe("resumeDownload", () => {
    it("should successfully resume a download", async () => {
      const mockDownloadSnapshot = {
        url,
        fileUri,
        options: {},
        resumeData: "mockData",
      };
      const mockResult = {
        uri: fileUri,
        md5: "mock-md5",
      };

      (
        mockedAsyncStorage.getItem as jest.MockedFunction<any>
      ).mockResolvedValue(JSON.stringify(mockDownloadSnapshot));
      mockResumeAsync.mockResolvedValue(mockResult);
      (
        mockedAsyncStorage.setItem as jest.MockedFunction<any>
      ).mockResolvedValue(undefined);

      const result = await resumeDownload(fileUri, mockProgressCallback);

      expect(result).toBe(fileUri);
      expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith(
        `paused_${fileUri}`,
      );
      expect(mockedFileSystem.createDownloadResumable).toHaveBeenCalledWith(
        url,
        fileUri,
        {},
        mockProgressCallback,
        "mockData",
      );
      expect(mockResumeAsync).toHaveBeenCalledTimes(1);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        `download_${fileUri}`,
        JSON.stringify({ uri: fileUri }),
      );
    });

    it("should successfully resume a download without callback", async () => {
      const mockDownloadSnapshot = {
        url,
        fileUri,
        options: {},
        resumeData: "mockData",
      };
      const mockResult = {
        uri: fileUri,
        md5: "mock-md5",
      };

      (
        mockedAsyncStorage.getItem as jest.MockedFunction<any>
      ).mockResolvedValue(JSON.stringify(mockDownloadSnapshot));
      mockResumeAsync.mockResolvedValue(mockResult);
      (
        mockedAsyncStorage.setItem as jest.MockedFunction<any>
      ).mockResolvedValue(undefined);

      const result = await resumeDownload(fileUri);

      expect(result).toBe(fileUri);
      expect(mockedFileSystem.createDownloadResumable).toHaveBeenCalledWith(
        url,
        fileUri,
        {},
        undefined,
        "mockData",
      );
    });

    it("should throw error if no paused download is found", async () => {
      (mockedAsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        null as never,
      );

      await expect(resumeDownload(fileUri)).rejects.toThrow(
        "Failed to resume download: No paused download found",
      );
      expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith(
        `paused_${fileUri}`,
      );
      expect(mockedFileSystem.createDownloadResumable).not.toHaveBeenCalled();
    });

    it("should throw error when resumeAsync returns null", async () => {
      const mockDownloadSnapshot = {
        url,
        fileUri,
        options: {},
        resumeData: "mockData",
      };

      (mockedAsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockDownloadSnapshot) as never,
      );
      mockResumeAsync.mockResolvedValue(null);

      await expect(resumeDownload(fileUri)).rejects.toThrow(
        "Failed to resume download: Resume failed: No result returned",
      );
      expect(mockResumeAsync).toHaveBeenCalledTimes(1);
      expect(mockedAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it("should throw error on resume failure", async () => {
      const mockDownloadSnapshot = {
        url,
        fileUri,
        options: {},
        resumeData: "mockData",
      };

      (mockedAsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockDownloadSnapshot) as never,
      );
      mockResumeAsync.mockRejectedValue(new Error("Resume failed"));

      await expect(resumeDownload(fileUri)).rejects.toThrow(
        "Failed to resume download: Resume failed",
      );
      expect(mockResumeAsync).toHaveBeenCalledTimes(1);
      expect(mockedAsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
