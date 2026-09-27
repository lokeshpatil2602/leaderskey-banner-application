import { Design, CanvasPreset } from './types';

/**
 * Resize a design to a target canvas preset.
 *
 * The algorithm scales each element proportionally based on the ratio between
 * the original and target canvas dimensions. It preserves the element's relative
 * position and size while keeping the rotation unchanged.
 *
 * This is a deterministic, simple smart‑resize implementation that can be
 * extended later with more sophisticated rules (e.g., keeping text readable,
 * avoiding overflow, etc.).
 */
export function resizeDesign(original: Design, target: CanvasPreset): Design {
  const { width: origW, height: origH } = original.preset;
  const scaleX = target.width / origW;
  const scaleY = target.height / origH;

  const resizedElements = original.elements.map((el) => ({
    ...el,
    x: Math.round(el.x * scaleX),
    y: Math.round(el.y * scaleY),
    width: Math.round(el.width * scaleX),
    height: Math.round(el.height * scaleY),
    // rotation stays the same
  }));

  return {
    preset: target,
    elements: resizedElements,
  };
}
