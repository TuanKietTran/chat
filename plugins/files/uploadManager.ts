import { File } from "expo-file-system/next";
import * as tus from "tus-js-client";
const DEFAULT_CHUNK_SIZE = 6 * 1024 * 1024; // 5MB chunks,
const CUSTOM_UPLOAD_LINK_HEADER = "X-Custom-Upload-Link";

// Original function (unchanged for backwards compatibility)
export async function uploadFile(
  fileUri: string,
  endpoint: string,
  metadata: Record<string, string> = {},
  headers: Record<string, string> = {},
  onProgress?: (progress: number) => void,
): Promise<string> {
  try {
    const file = new File(fileUri);
    if (!file.exists) {
      throw new Error("File does not exist");
    }

    const fileName = fileUri.split("/").pop() || "unknown";

    return new Promise((resolve, reject) => {
      let customUploadedUrl: string | undefined = undefined;
      const upload = new tus.Upload(
        {
          uri: fileUri,
          ...metadata,
        } as any,
        {
          endpoint,
          uploadSize: file.size,
          retryDelays: [0, 3000, 5000, 10000],
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            filename: fileName,
            ...metadata,
          },
          headers,
          chunkSize: DEFAULT_CHUNK_SIZE,
          onAfterResponse: function (_, res) {
            customUploadedUrl = res.getHeader(CUSTOM_UPLOAD_LINK_HEADER); // Get the XMLHttpRequest object
          },
          onError: (error) =>
            reject(new Error(`Upload failed: ${error.message}`)),
          onProgress: (bytesUploaded, bytesTotal) => {
            if (onProgress) {
              const percentage = (bytesUploaded / bytesTotal) * 100;
              onProgress(percentage);
            }
          },
          onSuccess: () => {
            const url = customUploadedUrl ?? upload.url;
            if (url) {
              resolve(url);
            } else {
              reject(new Error("Upload succeeded but no URL was provided"));
            }
          },
        },
      );

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
