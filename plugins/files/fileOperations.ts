// plugins/expo-file-manager/fileOperations.ts
import * as FileSystem from 'expo-file-system';

export async function readFile(fileUri: string): Promise<string> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    return await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    throw new Error(`Failed to read file: ${(error as Error).message}`);
  }
}

export async function writeFile(fileUri: string, content: string): Promise<boolean> {
  try {
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return true;
  } catch (error) {
    throw new Error(`Failed to write file: ${(error as Error).message}`);
  }
}

export async function deleteFile(fileUri: string): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri);
      return true;
    }
    return false;
  } catch (error) {
    throw new Error(`Failed to delete file: ${(error as Error).message}`);
  }
}