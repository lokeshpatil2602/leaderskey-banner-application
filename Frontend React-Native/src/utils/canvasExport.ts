import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type ExportOptions = {
  format?: 'png' | 'jpg';
  quality?: number;
  width?: number;
  height?: number;
};

/**
 * Robustly exports a canvas View ref to a high-resolution local temporary image file.
 * Handles React Native ViewShot native tag resolution safely.
 */
export async function exportCanvas(
  viewRef: any,
  options: ExportOptions = {}
): Promise<string> {
  const target = viewRef?.current ? viewRef.current : viewRef;
  if (!target) {
    throw new Error('Canvas reference is not ready or view is unmounted.');
  }

  const { format = 'png', quality = 1.0, width, height } = options;

  const captureOptions: any = {
    format,
    quality,
    result: 'tmpfile'
  };

  if (width && height && width > 0 && height > 0) {
    captureOptions.width = width;
    captureOptions.height = height;
  }

  // Allow native rendering tick to settle
  await new Promise((resolve) => setTimeout(resolve, 80));

  const uri = await captureRef(target, captureOptions);

  if (!uri) {
    throw new Error('Failed to capture canvas image.');
  }

  // Verify file existence on disk
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    throw new Error('Captured image file could not be verified on device.');
  }

  return uri;
}

/**
 * Exports canvas and opens native Android/iOS share sheet with fallback.
 */
export async function shareCanvasImage(
  viewRef: any,
  options: ExportOptions = {},
  dialogTitle = 'Share Banner'
): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not supported on this device.');
  }

  const fileUri = await exportCanvas(viewRef, options);

  await Sharing.shareAsync(fileUri, {
    mimeType: options.format === 'jpg' ? 'image/jpeg' : 'image/png',
    dialogTitle,
    UTI: options.format === 'jpg' ? 'public.jpeg' : 'public.png'
  });
}
