import { captureRef } from 'react-native-view-shot';
import { CanvasPreset } from '../features/editor/resize/types';

export async function exportCanvas(
  viewRef: any,
  preset?: CanvasPreset,
  format: 'png' | 'jpg' = 'png'
): Promise<string> {
  const options = {
    format,
    quality: 1,
    result: 'tmpfile' as const,
    ...(preset?.width && preset?.height
      ? { width: preset.width, height: preset.height }
      : {})
  };
  return await captureRef(viewRef, options);
}
