// plugins/expo-file-manager/pickerManager.ts
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { checkPermissions } from './utils';

export interface MediaPickerOptions {
  mediaTypes?: ImagePicker.ImagePickerOptions['mediaTypes'];
  allowsEditing?: boolean;
  quality?: number;
}

export async function pickDocument(): Promise<string> {
  try {
    await checkPermissions(['MEDIA_LIBRARY']);
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

export async function pickMedia(options: MediaPickerOptions = { mediaTypes: ImagePicker.MediaTypeOptions.All }): Promise<string> {
  try {
    await checkPermissions(['MEDIA_LIBRARY', 'CAMERA']);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: options.mediaTypes,
      allowsEditing: options.allowsEditing || false,
      quality: options.quality || 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      return result.assets[0].uri;
    }
    throw new Error('Media picking canceled');
  } catch (error) {
    throw new Error(`Failed to pick media: ${(error as Error).message}`);
  }
}

export async function saveToDownloads(fileUri: string, filename: string): Promise<string> {
  try {
    await checkPermissions(['MEDIA_LIBRARY']);
    if (Platform.OS === 'android') {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const newUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          filename,
          'application/octet-stream'
        );
        await FileSystem.writeAsStringAsync(newUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return newUri;
      }
      throw new Error('Directory permission denied');
    } else {
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      const album = await MediaLibrary.getAlbumAsync('Download');
      if (album == null) {
        await MediaLibrary.createAlbumAsync('Download', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      return asset.uri;
    }
  } catch (error) {
    throw new Error(`Failed to save to downloads: ${(error as Error).message}`);
  }
}