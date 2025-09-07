// plugins/expo-file-manager/downloadManager.ts
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DownloadResumableSavable {
  url: string;
  fileUri: string;
  options: FileSystem.DownloadOptions;
  resumeData?: string;
}

export async function downloadFile(
  url: string,
  fileUri: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {},
      onProgress
        ? (progress) => {
            const percentage = (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100;
            onProgress(percentage);
          }
        : undefined
    );

    const result = await downloadResumable.downloadAsync();
    if (!result) {
      throw new Error('Download failed: No result returned');
    }

    const { uri } = result;
    await AsyncStorage.setItem(`download_${fileUri}`, JSON.stringify({ uri }));
    return uri;
  } catch (error) {
    throw new Error(`Download failed: ${(error as Error).message}`);
  }
}

export async function pauseDownload(downloadResumable: FileSystem.DownloadResumable): Promise<boolean> {
  try {
    await downloadResumable.pauseAsync();
    await AsyncStorage.setItem(
      `paused_${downloadResumable.fileUri}`,
      JSON.stringify(downloadResumable.savable())
    );
    return true;
  } catch (error) {
    throw new Error(`Failed to pause download: ${(error as Error).message}`);
  }
}

export async function resumeDownload(
  fileUri: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const downloadSnapshotJson = await AsyncStorage.getItem(`paused_${fileUri}`);
    if (!downloadSnapshotJson) {
      throw new Error('No paused download found');
    }

    const downloadSnapshot: DownloadResumableSavable = JSON.parse(downloadSnapshotJson);
    const resumedDownload = new FileSystem.DownloadResumable(
      downloadSnapshot.url,
      downloadSnapshot.fileUri,
      downloadSnapshot.options,
      onProgress
        ? (progress) => {
            const percentage = (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100;
            onProgress(percentage);
          }
        : undefined,
      downloadSnapshot.resumeData
    );

    const result = await resumedDownload.resumeAsync();
    if (!result) {
      throw new Error('Resume failed: No result returned');
    }

    const { uri } = result;
    await AsyncStorage.setItem(`download_${fileUri}`, JSON.stringify({ uri }));
    return uri;
  } catch (error) {
    throw new Error(`Failed to resume download: ${(error as Error).message}`);
  }
}