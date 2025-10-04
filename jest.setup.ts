import { NativeModules } from 'react-native';
import type { FileInfo } from 'expo-file-system';


// Mock react-native Platform with a Jest mock object
const mockPlatform = {
    OS: 'ios',
    select: jest.fn((obj) => obj['ios'] || obj.default),
};
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
    ...jest.requireActual('react-native/Libraries/Utilities/Platform') as object,
    ...mockPlatform,
}), { virtual: true });

// Mock NativeModules for EXFileSystem
NativeModules.EXFileSystem = {
    documentDirectory: 'file://mock/documentDirectory/',
};

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
    PermissionStatus: {
        GRANTED: 'granted',
        DENIED: 'denied',
        UNDETERMINED: 'undetermined',
    },
}));

// Mock Expo modules
jest.mock('expo-camera', () => ({
    Camera: {
        requestCameraPermissionsAsync: jest.fn(),
    },
}));

jest.mock('expo-media-library', () => ({
    requestPermissionsAsync: jest.fn(),
    createAssetAsync: jest.fn(() =>
        Promise.resolve({
            id: 'asset-id',
            filename: 'test.jpg',
            uri: 'file://mock/test.jpg',
            mediaType: 'photo',
            width: 100,
            height: 100,
            creationTime: 1234567890,
            modificationTime: 1234567890,
            duration: 0,
        })
    ),
    getAlbumAsync: jest.fn(() => Promise.resolve(null)),
    createAlbumAsync: jest.fn(() => Promise.resolve()),
    addAssetsToAlbumAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://mock/documentDirectory/',
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
  getInfoAsync: jest.fn(() => Promise.resolve({
    exists: true,
    uri: 'file://mock/test.txt',
    size: 100,
    isDirectory: false,
    modificationTime: 1234567890,
  } as FileInfo)),
  readAsStringAsync: jest.fn(() => Promise.resolve('SGVsbG8sIFdvcmxkIQ==')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  createDownloadResumable: jest.fn(() => ({
    downloadAsync: jest.fn(() => Promise.resolve({
      uri: 'file://mock/downloaded.pdf',
      md5: 'mock-md5',
    })),
    pauseAsync: jest.fn(() => Promise.resolve()),
    resumeAsync: jest.fn(() => Promise.resolve({
      uri: 'file://mock/downloaded.pdf',
      md5: 'mock-md5',
    })),
    savable: jest.fn(() => ({
      url: '',
      fileUri: '',
      options: {},
      resumeData: '',
    })),
    fileUri: 'file://mock/downloaded.pdf',
  })),
  StorageAccessFramework: {
    requestDirectoryPermissionsAsync: jest.fn(() => Promise.resolve({
      granted: true,
      directoryUri: 'file://mock/downloads/',
    })),
    createFileAsync: jest.fn(() => Promise.resolve('file://mock/file.txt')),
  },
}));

// Mock expo-file-system/next
jest.mock('expo-file-system/next', () => ({
  File: jest.fn().mockImplementation((uri: string) => ({
    uri,
    exists: true,
    size: 100,
    name: uri.split('/').pop() || 'unknown',
    mimeType: 'application/octet-stream',
  })),
}));

jest.mock('expo-document-picker', () => ({
    getDocumentAsync: jest.fn(() =>
        Promise.resolve({
            canceled: false,
            assets: [
                {
                    uri: 'file://mock/document.pdf',
                    name: 'document.pdf',
                    mimeType: 'application/pdf',
                    size: 1024,
                },
            ],
        })
    ),
}));

jest.mock('expo-image-picker', () => ({
    launchImageLibraryAsync: jest.fn(() =>
        Promise.resolve({
            canceled: false,
            assets: [
                {
                    uri: 'file://mock/image.jpg',
                    width: 100,
                    height: 100,
                    fileName: 'image.jpg',
                    type: 'image',
                },
            ],
        })
    ),
    MediaTypeOptions: {
        All: 'all',
        Images: 'images',
    },
}));

// Mock tus-js-client
jest.mock('tus-js-client', () => ({
  Upload: jest.fn((blob, options) => ({
    options,
    findPreviousUploads: jest.fn(() => Promise.resolve([])),
    resumeFromPreviousUpload: jest.fn(),
    start: jest.fn(),
  })),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
}));