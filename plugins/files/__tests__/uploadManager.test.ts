import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { File } from "expo-file-system/next";
import * as tus from "tus-js-client";
import { uploadFile } from "../uploadManager";

// Use global mocks from jest.setup.ts
const mockedFile = jest.mocked(File);
const mockedTus = jest.mocked(tus);

describe("uploadManager", () => {
    const endpoint = "https://example.com/upload";
    const uploadUrl = `${endpoint}/123`; // Example upload URL
    const fileUri = "file://mock/documentDirectory/sample.pdf";
    const mockProgressCallback: jest.MockedFunction<(progress: number) => void> =
        jest.fn();
    const metadata: Record<string, string> = { key: "value" };

    // Mock tus.Upload
    let mockTusUpload: jest.MockedObject<tus.Upload>;
    let mockFindPreviousUploads: jest.MockedFunction<
        () => Promise<tus.PreviousUpload[]>
    >;
    let mockResumeFromPreviousUpload: jest.MockedFunction<
        (upload: tus.PreviousUpload) => void
    >;
    let mockStart: jest.MockedFunction<() => void>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock File class
        (mockedFile as any).mockImplementation((...args: any[]) => ({
            uri: args[0],
            exists: true,
            size: 100,
            name: args[0].split('/').pop() || 'unknown',
            mimeType: 'application/octet-stream',
        }));

        // Mock tus.Upload
        mockFindPreviousUploads = jest.fn(() => Promise.resolve([]));
        mockResumeFromPreviousUpload = jest.fn();
        mockStart = jest.fn();
        mockTusUpload = {
            file: null as any,
            options: undefined as any,
            findPreviousUploads: mockFindPreviousUploads,
            resumeFromPreviousUpload: mockResumeFromPreviousUpload,
            start: mockStart,
            url: uploadUrl,
            abort: undefined as any,
        };
        mockedTus.Upload.mockImplementation((blob: any, options: any) => {
            mockTusUpload.file = blob;
            mockTusUpload.options = options;
            return mockTusUpload;
        });
    });

    describe("uploadFile", () => {
        it("should successfully upload a file", async () => {
            mockFindPreviousUploads.mockResolvedValue([]);
            mockStart.mockImplementation(() => {
              mockTusUpload.options?.onSuccess?.({} as any);
            });

            const result = await uploadFile(
                fileUri,
                endpoint,
                metadata,
                {},
                mockProgressCallback
            );

            expect(result).toBe(uploadUrl);
            expect(mockedFile).toHaveBeenCalledWith(fileUri);
            expect(mockedTus.Upload).toHaveBeenCalledWith(
                expect.objectContaining({
                    uri: fileUri,
                    key: "value",
                }),
                expect.objectContaining({
                    endpoint,
                    uploadSize: 100,
                    retryDelays: [0, 3000, 5000, 10000],
                    uploadDataDuringCreation: true,
                    removeFingerprintOnSuccess: true,
                    metadata: expect.objectContaining({
                        filename: "sample.pdf",
                        key: "value",
                    }),
                    headers: {},
                    chunkSize: 6 * 1024 * 1024,
                    onAfterResponse: expect.any(Function),
                    onProgress: expect.any(Function),
                    onSuccess: expect.any(Function),
                    onError: expect.any(Function),
                })
            );
            expect(mockFindPreviousUploads).toHaveBeenCalledTimes(1);
            expect(mockStart).toHaveBeenCalledTimes(1);
            expect(mockProgressCallback).not.toHaveBeenCalled();
        });

        it("should successfully upload a file without callback", async () => {
            mockFindPreviousUploads.mockResolvedValue([]);
            mockStart.mockImplementation(() => {
                mockTusUpload.options?.onSuccess?.({} as any);
            });

            const result = await uploadFile(fileUri, endpoint, metadata);

            expect(result).toBe(uploadUrl);
            expect(mockedTus.Upload).toHaveBeenCalledWith(
                expect.objectContaining({
                    uri: fileUri,
                }),
                expect.objectContaining({
                    endpoint,
                    uploadSize: 100,
                    retryDelays: [0, 3000, 5000, 10000],
                    uploadDataDuringCreation: true,
                    removeFingerprintOnSuccess: true,
                    metadata: expect.objectContaining({
                        filename: "sample.pdf",
                        key: "value",
                    }),
                    chunkSize: 6 * 1024 * 1024,
                    onAfterResponse: expect.any(Function),
                    onProgress: expect.any(Function),
                    onSuccess: expect.any(Function),
                    onError: expect.any(Function),
                })
            );
            expect(mockStart).toHaveBeenCalledTimes(1);
        });

        it("should call onProgress with percentage", async () => {
            mockFindPreviousUploads.mockResolvedValue([]);
            mockStart.mockImplementation(() => {
                mockTusUpload.options?.onProgress?.(50, 100); // 50%
                mockTusUpload.options?.onSuccess?.({} as any);
            });

            const result = await uploadFile(
                fileUri,
                endpoint,
                metadata,
                {},
                mockProgressCallback
            );

            expect(result).toBe(uploadUrl);
            expect(mockProgressCallback).toHaveBeenCalledWith(50);
            expect(mockProgressCallback).toHaveBeenCalledTimes(1);
        });

        it("should throw error if file does not exist", async () => {
            (mockedFile as any).mockImplementationOnce((...args: any[]) => ({
                uri: args[0],
                exists: false,
                size: 0,
                name: args[0].split('/').pop() || 'unknown',
                mimeType: 'application/octet-stream',
            }));

            await expect(uploadFile(fileUri, endpoint)).rejects.toThrow(
                "Upload setup failed: File does not exist"
            );
            expect(mockedFile).toHaveBeenCalledWith(fileUri);
            expect(mockedTus.Upload).not.toHaveBeenCalled();
        });

        it("should throw error on upload failure", async () => {
            mockFindPreviousUploads.mockResolvedValue([]);
            mockStart.mockImplementation(() => {
                mockTusUpload.options?.onError?.(new Error("Network error"));
            });

            await expect(uploadFile(fileUri, endpoint)).rejects.toThrow(
                "Upload failed: Network error"
            );
            expect(mockStart).toHaveBeenCalledTimes(1);
        });

        it("should throw error if upload succeeds but no URL provided", async () => {
            mockFindPreviousUploads.mockResolvedValue([]);
            mockTusUpload.url = undefined as any; // Simulate no URL
            mockStart.mockImplementation(() => {
                mockTusUpload.options?.onSuccess?.({} as any);
            });

            await expect(uploadFile(fileUri, endpoint)).rejects.toThrow(
                "Upload succeeded but no URL was provided"
            );
            expect(mockStart).toHaveBeenCalledTimes(1);
        });

        it("should resume from previous upload", async () => {
            const previousUpload: tus.PreviousUpload = {
                size: 100,
                metadata: {
                    filename: "sample.pdf",
                    filetype: "application/octet-stream",
                },
                creationTime: new Date().toISOString(),
                urlStorageKey: "key",
                uploadUrl: uploadUrl,
                parallelUploadUrls: [],
            };
            mockFindPreviousUploads.mockResolvedValue([previousUpload]);
            mockStart.mockImplementation(() => {
                mockTusUpload.options?.onSuccess?.({} as any);
            });

            const result = await uploadFile(
                fileUri,
                endpoint,
                metadata,
                {},
                mockProgressCallback
            );

            expect(result).toBe(uploadUrl);
            expect(mockFindPreviousUploads).toHaveBeenCalledTimes(1);
            expect(mockResumeFromPreviousUpload).toHaveBeenCalledWith(previousUpload);
            expect(mockStart).toHaveBeenCalledTimes(1);
        });

        it("should pass custom headers to tus upload", async () => {
            const customHeaders = { 'Authorization': 'Bearer token123' };
            mockFindPreviousUploads.mockResolvedValue([]);
            mockStart.mockImplementation(() => {
                mockTusUpload.options?.onSuccess?.({} as any);
            });

            const result = await uploadFile(
                fileUri,
                endpoint,
                metadata,
                customHeaders,
                mockProgressCallback
            );

            expect(result).toBe(uploadUrl);
            expect(mockedTus.Upload).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    headers: customHeaders,
                })
            );
        });
    });
});