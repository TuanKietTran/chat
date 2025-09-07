// jest.setup.js
import { NativeModules, Platform } from 'react-native';

// Mock react-native Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios', // Default to iOS; override in tests for Android
  select: jest.fn((obj) => obj[Platform.OS]),
}));

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

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://mock/documentDirectory/',
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  createDownloadResumable: jest.fn(() => ({
    downloadAsync: jest.fn(() =>
      Promise.resolve({ uri: 'file://mock/downloaded.pdf', md5: 'mock-md5' })
    ),
    pauseAsync: jest.fn(() => Promise.resolve()),
    resumeAsync: jest.fn(() =>
      Promise.resolve({ uri: 'file://mock/downloaded.pdf', md5: 'mock-md5' })
    ),
    savable: jest.fn(() => ({ url: '', fileUri: '', options: {}, resumeData: '' })),
  })),
  StorageAccessFramework: {
    requestDirectoryPermissionsAsync: jest.fn(() =>
      Promise.resolve({ granted: true, directoryUri: 'file://mock/downloads/' })
    ),
    createFileAsync: jest.fn(() => Promise.resolve('file://mock/file.txt')),
  },
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
  Upload: jest.fn((file, options) => {
    const mockUpload = {
      findPreviousUploads: jest.fn(() => Promise.resolve([])),
      start: jest.fn(),
      resumeFromPreviousUpload: jest.fn(),
    };
    options.onSuccess?.({ fileId: 'mock-id', url: options.endpoint });
    return mockUpload;
  }),
}));

// Mock utils module
jest.mock('./plugins/files/utils', () => ({
  checkPermissions: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));