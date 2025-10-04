import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function downloadFile(
  url: string,
  fileUri: string,
  callback?: FileSystem.FileSystemNetworkTaskProgressCallback<FileSystem.DownloadProgressData>
): Promise<string> {
  try {
    const downloadResumable = FileSystem.createDownloadResumable(url, fileUri, {}, callback);
    const result = await downloadResumable.downloadAsync();
    if (!result) {
      throw new Error('Download failed: No result returned');
    }
    await AsyncStorage.setItem(`download_${fileUri}`, JSON.stringify({ uri: result.uri }));
    return result.uri;
  } catch (error) {
    throw new Error(`Download failed: ${(error as Error).message}`);
  }
}

export async function pauseDownload(downloadResumable: FileSystem.DownloadResumable): Promise<boolean> {
  try {
    await downloadResumable.pauseAsync();
    const snapshot = downloadResumable.savable();
    await AsyncStorage.setItem(`paused_${downloadResumable.fileUri}`, JSON.stringify(snapshot));
    return true;
  } catch (error) {
    throw new Error(`Failed to pause download: ${(error as Error).message}`);
  }
}

export async function resumeDownload(
  fileUri: string,
  callback?: FileSystem.FileSystemNetworkTaskProgressCallback<FileSystem.DownloadProgressData>
): Promise<string> {
  try {
    const snapshotString = await AsyncStorage.getItem(`paused_${fileUri}`);
    if (!snapshotString) {
      throw new Error('No paused download found');
    }
    const snapshot = JSON.parse(snapshotString) as FileSystem.DownloadPauseState;
    const downloadResumable = FileSystem.createDownloadResumable(
      snapshot.url,
      snapshot.fileUri,
      snapshot.options,
      callback,
      snapshot.resumeData
    );
    const result = await downloadResumable.resumeAsync();
    if (!result) {
      throw new Error('Resume failed: No result returned');
    }
    await AsyncStorage.setItem(`download_${fileUri}`, JSON.stringify({ uri: result.uri }));
    return result.uri;
  } catch (error) {
    throw new Error(`Failed to resume download: ${(error as Error).message}`);
  }
}