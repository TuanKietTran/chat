// plugins/files/__tests__/fileOperation.test.ts
import { describe, it, expect, jest } from "@jest/globals";
import * as FileSystem from "expo-file-system";
import { readFile, writeFile, deleteFile } from "../fileOperations";

// Use global mock from jest.setup.js
const mockedFileSystem = jest.mocked(FileSystem);

describe("fileOperations", () => {
  const fileUri = `${FileSystem.documentDirectory}test.txt`;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("readFile", () => {
    it("should read file content successfully", async () => {
      mockedFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: fileUri,
        size: 100,
        isDirectory: false,
        modificationTime: 1234567890,
      });
      mockedFileSystem.readAsStringAsync.mockResolvedValue("Hello, World!");

      const content = await readFile(fileUri);
      expect(content).toBe("Hello, World!");
      expect(mockedFileSystem.getInfoAsync).toHaveBeenCalledWith(fileUri);
      expect(mockedFileSystem.readAsStringAsync).toHaveBeenCalledWith(fileUri, {
        encoding: "utf8",
      });
    });

    it("should throw error if file does not exist", async () => {
      mockedFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        uri: fileUri,
        isDirectory: false,
      });

      await expect(readFile(fileUri)).rejects.toThrow("File does not exist");
    });

    it("should throw error on read failure", async () => {
      mockedFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: fileUri,
        size: 100,
        isDirectory: false,
        modificationTime: 1234567890,
      });
      mockedFileSystem.readAsStringAsync.mockRejectedValue(
        new Error("Read error"),
      );

      await expect(readFile(fileUri)).rejects.toThrow(
        "Failed to read file: Read error",
      );
    });
  });

  describe("writeFile", () => {
    it("should write file successfully", async () => {
      mockedFileSystem.writeAsStringAsync.mockResolvedValue(undefined);

      const result = await writeFile(fileUri, "Hello, World!");
      expect(result).toBe(true);
      expect(mockedFileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        fileUri,
        "Hello, World!",
        {
          encoding: "utf8",
        },
      );
    });

    it("should throw error on write failure", async () => {
      mockedFileSystem.writeAsStringAsync.mockRejectedValue(
        new Error("Write error"),
      );

      await expect(writeFile(fileUri, "Hello, World!")).rejects.toThrow(
        "Failed to write file: Write error",
      );
    });
  });

  describe("deleteFile", () => {
    it("should delete file successfully", async () => {
      mockedFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: fileUri,
        size: 100,
        isDirectory: false,
        modificationTime: 1234567890,
      });
      mockedFileSystem.deleteAsync.mockResolvedValue(undefined);

      const result = await deleteFile(fileUri);
      expect(result).toBe(true);
      expect(mockedFileSystem.getInfoAsync).toHaveBeenCalledWith(fileUri);
      expect(mockedFileSystem.deleteAsync).toHaveBeenCalledWith(fileUri);
    });

    it("should return false if file does not exist", async () => {
      mockedFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        uri: fileUri,
        isDirectory: false,
      });

      const result = await deleteFile(fileUri);
      expect(result).toBe(false);
      expect(mockedFileSystem.deleteAsync).not.toHaveBeenCalled();
    });

    it("should throw error on delete failure", async () => {
      mockedFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: fileUri,
        size: 100,
        isDirectory: false,
        modificationTime: 1234567890,
      });
      mockedFileSystem.deleteAsync.mockRejectedValue(new Error("Delete error"));

      await expect(deleteFile(fileUri)).rejects.toThrow(
        "Failed to delete file: Delete error",
      );
    });
  });
});
