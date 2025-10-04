import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { checkPermissions } from './utils';

export interface MediaPickerOptions {
  mediaTypes?: ('images' | 'videos' | 'livePhotos')[];
  allowsEditing?: boolean;
  quality?: number;
}

export async function pickDocument(): Promise<string> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      return result.assets[0].uri;
    }
    throw new Error('Document picking canceled');
  } catch (error) {
    throw new Error(`Failed to pick document: ${(error as Error).message}`);
  }
}

export async function pickMedia(options: MediaPickerOptions = {
  mediaTypes: Platform.OS === 'ios' ? ['images', 'videos', 'livePhotos'] : ['images', 'videos'],
}): Promise<ImagePicker.ImagePickerAsset> {
  try {
    await checkPermissions(['MEDIA_LIBRARY', 'CAMERA']);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: options.mediaTypes || ['images', 'videos'],
      allowsEditing: options.allowsEditing || false,
      quality: options.quality || 1,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) {
      throw new Error('Media picking canceled');
    }
    return result.assets[0];
  } catch (error) {
    throw new Error(`Failed to pick media: ${(error as Error).message}`);
  }
}

export async function saveToDownloads(fileUri: string, filename: string): Promise<string> {
  try {
    await checkPermissions(['MEDIA_LIBRARY']);

    if (Platform.OS === 'android') {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        throw new Error('Directory permission denied');
      }
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
      const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        filename,
        'application/octet-stream'
      );
      await FileSystem.writeAsStringAsync(newFileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      return newFileUri;
    } else {
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      let album = await MediaLibrary.getAlbumAsync('Download');
      if (album == null) {
        album = await MediaLibrary.createAlbumAsync('Download', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      return asset.uri;
    }
  } catch (error) {
    throw new Error(`Failed to save to downloads: ${(error as Error).message}`);
  }
}