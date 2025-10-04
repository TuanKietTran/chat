import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import {
    pickDocument,
    pickMedia,
    saveToDownloads,
    MediaPickerOptions,
} from "../pickerManager";
import { Camera } from "expo-camera";
import { PermissionStatus } from "expo-modules-core";

// Mock Platform globally (already done in jest.setup.ts, but we override OS in tests)
jest.mock("react-native", () => ({
    Platform: {
        OS: "ios",
        select: jest.fn((obj: any) => obj[Platform.OS]),
    },
}));

// Use global mocks from jest.setup.ts
const mockedDocumentPicker = jest.mocked(DocumentPicker);
const mockedImagePicker = jest.mocked(ImagePicker);
const mockedMediaLibrary = jest.mocked(MediaLibrary);
const mockedFileSystem = jest.mocked(FileSystem);
const mockedCamera = jest.mocked(Camera);

describe("pickerManager", () => {
    const fileUri = `${FileSystem.documentDirectory}test.txt`;
    const filename = "downloaded_file.txt";
    const imageAsset: ImagePicker.ImagePickerAsset = {
        uri: fileUri,
        width: 100,
        height: 100,
        fileName: "test.jpg",
        type: "image",
    };
    const videoAsset: ImagePicker.ImagePickerAsset = {
        uri: fileUri,
        width: 100,
        height: 100,
        fileName: "test.mp4",
        type: "video",
    };
    const livePhotoAsset: ImagePicker.ImagePickerAsset = {
        uri: fileUri,
        width: 100,
        height: 100,
        fileName: "test.mov",
        type: "livePhoto",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        Platform.OS = "ios"; // Set to 'ios' to match Platform.OS type
    });

    describe("pickDocument", () => {
        it("should successfully pick a document", async () => {
            mockedDocumentPicker.getDocumentAsync.mockResolvedValue({
                canceled: false,
                assets: [
                    {
                        uri: fileUri,
                        name: "test.txt",
                        mimeType: "text/plain",
                        size: 1024,
                    },
                ],
            });

            const result = await pickDocument();
            expect(result).toBe(fileUri);
            expect(mockedDocumentPicker.getDocumentAsync).toHaveBeenCalledWith({
                type: "*/*",
                copyToCacheDirectory: true,
            });
        });

        it("should throw error when picking is canceled", async () => {
            mockedDocumentPicker.getDocumentAsync.mockResolvedValue({
                canceled: true,
                assets: null,
            });

            await expect(pickDocument()).rejects.toThrow("Document picking canceled");
        });
    });

    describe("pickMedia", () => {
        it("should successfully pick an image", async () => {
            const options: MediaPickerOptions = { mediaTypes: ["images"] };
            mockedCamera.requestCameraPermissionsAsync.mockResolvedValue({
                status: PermissionStatus.GRANTED,
                expires: "never",
                granted: true,
                canAskAgain: true,
            });
            mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue({
                status: PermissionStatus.GRANTED,
                expires: "never",
                granted: true,
                canAskAgain: true,
            });
            mockedImagePicker.launchImageLibraryAsync.mockResolvedValue({
                canceled: false,
                assets: [imageAsset],
            });

            const result = await pickMedia(options);
            expect(result).toEqual(imageAsset);
            expect(mockedCamera.requestCameraPermissionsAsync).toHaveBeenCalled();
            expect(mockedMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
            expect(mockedImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
                mediaTypes: ["images"],
                allowsEditing: false,
                quality: 1,
            });
        });

        it("should successfully pick a video", async () => {
            const options: MediaPickerOptions = { mediaTypes: ["videos"] };
            mockedCamera.requestCameraPermissionsAsync.mockResolvedValue({
                status: PermissionStatus.GRANTED,
                expires: "never",
                granted: true,
                canAskAgain: true,
            });
            mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue({
                status: PermissionStatus.GRANTED,
                expires: "never",
                granted: true,
                canAskAgain: true,
            });
            mockedImagePicker.launchImageLibraryAsync.mockResolvedValue({
                canceled: false,
                assets: [videoAsset],
            });

            const result = await pickMedia(options);
            expect(result).toEqual(videoAsset);
            expect(mockedCamera.requestCameraPermissionsAsync).toHaveBeenCalled();
            expect(mockedMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
            expect(mockedImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
                mediaTypes: ["videos"],
                allowsEditing: false,
                quality: 1,
            });
        });

        it("should successfully pick a live photo on iOS", async () => {
            const options: MediaPickerOptions = { mediaTypes: ["livePhotos"] };
            mockedCamera.requestCameraPermissionsAsync.mockResolvedValue({
                status: PermissionStatus.GRANTED,
                expires: "never",
                granted: true,
                canAskAgain: true,
            });
            mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue({
                status: PermissionStatus.GRANTED,
                expires: "never",
                granted: true,
                canAskAgain: true,
            });
            mockedImagePicker.launchImageLibraryAsync.mockResolvedValue({
                canceled: false,
                assets: [livePhotoAsset],
            });

            const result = await pickMedia(options);
            expect(result).toEqual(livePhotoAsset);
            expect(mockedCamera.requestCameraPermissionsAsync).toHaveBeenCalled();
            expect(mockedMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
            expect(mockedImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
                mediaTypes: ["livePhotos"],
                allowsEditing: false,
                quality: 1,
            });
        });

        it("should throw error when picking is canceled", async () => {
            const options: MediaPickerOptions = { mediaTypes: ["images"] };
            mockedCamera.requestCameraPermissionsAsync.mockResolvedValue({
                status: PermissionStatus.GRANTED,
                expires: "never",
                granted: true,
                canAskAgain: true,
            });
            mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue({
                status: PermissionStatus.GRANTED,
                expires: "never",
                granted: true,
                canAskAgain: true,
            });
            mockedImagePicker.launchImageLibraryAsync.mockResolvedValue({
                canceled: true,
                assets: null,
            });

            await expect(pickMedia(options)).rejects.toThrow(
                "Media picking canceled"
            );
            expect(mockedCamera.requestCameraPermissionsAsync).toHaveBeenCalled();
            expect(mockedMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
        });

        it("should throw error when camera permission is denied", async () => {
            const options: MediaPickerOptions = { mediaTypes: ["images"] };
            mockedCamera.requestCameraPermissionsAsync.mockResolvedValue({
                status: PermissionStatus.DENIED,
                expires: "never",
                granted: false,
                canAskAgain: true,
            });
            mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue({
                status: PermissionStatus.GRANTED,
                expires: "never",
                granted: true,
                canAskAgain: true,
            });

            await expect(pickMedia(options)).rejects.toThrow(
                "Camera permission denied"
            );
            expect(mockedCamera.requestCameraPermissionsAsync).toHaveBeenCalled();
            expect(mockedMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
        });

        it("should throw error when media library permission is denied", async () => {
            const options: MediaPickerOptions = { mediaTypes: ["images"] };
            mockedCamera.requestCameraPermissionsAsync.mockResolvedValue({
                status: PermissionStatus.GRANTED,
                expires: "never",
                granted: true,
                canAskAgain: true,
            });
            mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue({
                status: PermissionStatus.DENIED,
                expires: "never",
                granted: false,
                canAskAgain: true,
            });

            await expect(pickMedia(options)).rejects.toThrow(
                "Media Library permission denied"
            );
            expect(mockedCamera.requestCameraPermissionsAsync).toHaveBeenCalled();
            expect(mockedMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
        });
    });

    describe("saveToDownloads", () => {
        describe("Android", () => {
            beforeEach(() => {
                Platform.OS = "android";
            });

            it("should successfully save file to downloads", async () => {
                mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue({
                    status: PermissionStatus.GRANTED,
                    expires: "never",
                    granted: true,
                    canAskAgain: true,
                });
                mockedFileSystem.readAsStringAsync.mockResolvedValue(
                    "SGVsbG8sIFdvcmxkIQ=="
                );
                mockedFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync.mockResolvedValue(
                    {
                        granted: true,
                        directoryUri: "file://mock/downloads/",
                    }
                );
                mockedFileSystem.StorageAccessFramework.createFileAsync.mockResolvedValue(
                    fileUri
                );
                mockedFileSystem.writeAsStringAsync.mockResolvedValue(undefined);

                const result = await saveToDownloads(fileUri, filename);
                expect(result).toBe(fileUri);
                expect(mockedMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
                expect(
                    mockedFileSystem.StorageAccessFramework
                        .requestDirectoryPermissionsAsync
                ).toHaveBeenCalled();
                expect(
                    mockedFileSystem.StorageAccessFramework.createFileAsync
                ).toHaveBeenCalledWith(
                    "file://mock/downloads/",
                    filename,
                    "application/octet-stream"
                );
                expect(mockedFileSystem.writeAsStringAsync).toHaveBeenCalledWith(
                    fileUri,
                    "SGVsbG8sIFdvcmxkIQ==",
                    { encoding: "base64" }
                );
            });

            it("should throw error when directory permission is denied", async () => {
                mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue({
                    status: PermissionStatus.GRANTED,
                    expires: "never",
                    granted: true,
                    canAskAgain: true,
                });
                mockedFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync.mockResolvedValue(
                    {
                        granted: false,
                    }
                );

                await expect(saveToDownloads(fileUri, filename)).rejects.toThrow(
                    "Directory permission denied"
                );
                expect(mockedMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
            });
        });

        describe("iOS", () => {
            beforeEach(() => {
                Platform.OS = "ios";
            });

            it("should successfully save file to Downloads album", async () => {
                mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue({
                    status: PermissionStatus.GRANTED,
                    expires: "never",
                    granted: true,
                    canAskAgain: true,
                });
                mockedMediaLibrary.createAssetAsync.mockResolvedValue({
                    id: "asset-id",
                    filename: filename,
                    uri: fileUri,
                    mediaType: "photo",
                    width: 0,
                    height: 0,
                    creationTime: 1234567890,
                    modificationTime: 1234567890,
                    duration: 0,
                } as MediaLibrary.Asset);
                mockedMediaLibrary.getAlbumAsync.mockResolvedValue(null as any);

                const result = await saveToDownloads(fileUri, filename);
                expect(result).toBe(fileUri);
                expect(mockedMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
                expect(mockedMediaLibrary.createAssetAsync).toHaveBeenCalledWith(
                    fileUri
                );
                expect(mockedMediaLibrary.getAlbumAsync).toHaveBeenCalledWith(
                    "Download"
                );
                expect(mockedMediaLibrary.createAlbumAsync).toHaveBeenCalledWith(
                    "Download",
                    expect.any(Object),
                    false
                );
            });

            it("should add file to existing Downloads album", async () => {
                mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue({
                    status: PermissionStatus.GRANTED,
                    expires: "never",
                    granted: true,
                    canAskAgain: true,
                });
                mockedMediaLibrary.createAssetAsync.mockResolvedValue({
                    id: "asset-id",
                    filename: filename,
                    uri: fileUri,
                    mediaType: "photo",
                    width: 0,
                    height: 0,
                    creationTime: 1234567890,
                    modificationTime: 1234567890,
                    duration: 0,
                } as MediaLibrary.Asset);
                mockedMediaLibrary.getAlbumAsync.mockResolvedValue({
                    id: "album-id",
                    title: "Download",
                    assetCount: 0,
                    startTime: 1234567890,
                    endTime: 1234567890,
                } as MediaLibrary.Album);

                const result = await saveToDownloads(fileUri, filename);
                expect(result).toBe(fileUri);
                expect(mockedMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
                expect(mockedMediaLibrary.addAssetsToAlbumAsync).toHaveBeenCalledWith(
                    [expect.objectContaining({ uri: fileUri })],
                    {
                        id: "album-id",
                        title: "Download",
                        assetCount: 0,
                        startTime: 1234567890,
                        endTime: 1234567890,
                    },
                    false
                );
            });

            it("should throw error when permission is denied", async () => {
                mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue({
                    status: PermissionStatus.DENIED,
                    expires: "never",
                    granted: false,
                    canAskAgain: true,
                });

                await expect(saveToDownloads(fileUri, filename)).rejects.toThrow(
                    "Media Library permission denied"
                );
                expect(mockedMediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
            });
        });
    });
});
