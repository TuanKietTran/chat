import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as FileOperations from './fileOperations';
import * as DownloadManager from './downloadManager';
import * as UploadManager from './uploadManager';
import * as PickerManager from './pickerManager';
import { checkPermissions, PermissionType } from './utils';

export type ImageAsset = ImagePicker.ImagePickerAsset;

export interface FileManagerPlugin {
  readFile: (fileUri: string) => Promise<string>;
  writeFile: (fileUri: string, content: string) => Promise<boolean>;
  deleteFile: (fileUri: string) => Promise<boolean>;
  downloadFile: (
    url: string,
    fileUri: string,
    onProgress?: FileSystem.FileSystemNetworkTaskProgressCallback<FileSystem.DownloadProgressData>
  ) => Promise<string>;
  pauseDownload: (downloadResumable: FileSystem.DownloadResumable) => Promise<boolean>;
  resumeDownload: (
    fileUri: string,
    onProgress?: FileSystem.FileSystemNetworkTaskProgressCallback<FileSystem.DownloadProgressData>
  ) => Promise<string>;
  uploadFile: (
    fileUri: string,
    endpoint: string,
    metadata?: Record<string, string>,
    headers?: Record<string, string>,
    onProgress?: (progress: number) => void
  ) => Promise<string>;
  pickDocument: () => Promise<string>;
  pickMedia: (options?: PickerManager.MediaPickerOptions) => Promise<ImageAsset>;
  saveToDownloads: (fileUri: string, filename: string) => Promise<string>;
  checkPermissions: (permissionTypes: PermissionType[]) => Promise<boolean>;
}

const ExpoFileManagerPlugin: FileManagerPlugin = {
  readFile: FileOperations.readFile,
  writeFile: FileOperations.writeFile,
  deleteFile: FileOperations.deleteFile,
  downloadFile: DownloadManager.downloadFile,
  pauseDownload: DownloadManager.pauseDownload,
  resumeDownload: DownloadManager.resumeDownload,
  uploadFile: UploadManager.uploadFile,
  pickDocument: PickerManager.pickDocument,
  pickMedia: PickerManager.pickMedia,
  saveToDownloads: PickerManager.saveToDownloads,
  checkPermissions,
};

export default ExpoFileManagerPlugin;