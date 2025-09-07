// plugins/expo-file-manager/uploadManager.ts
import * as FileSystem from 'expo-file-system';
import * as tus from 'tus-js-client';

export async function uploadFile(
  fileUri: string,
  endpoint: string,
  metadata: Record<string, string> = {},
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    const blob = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    }).then((base64) => new Blob([Buffer.from(base64, 'base64')]));

    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(blob, {
        endpoint,
        retryDelays: [0, 3000, 5000, 10000],
        metadata: {
          filename: fileUri.split('/').pop() || 'unknown',
          filetype: 'application/octet-stream',
          ...metadata,
        },
        onError: (error) => reject(new Error(`Upload failed: ${error.message}`)),
        onProgress: (bytesUploaded, bytesTotal) => {
          if (onProgress) {
            const percentage = (bytesUploaded / bytesTotal) * 100;
            onProgress(percentage);
          }
        },
        onSuccess: () => resolve('Upload complete'),
      });

      upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      });
    });
  } catch (error) {
    throw new Error(`Upload setup failed: ${(error as Error).message}`);
  }
}