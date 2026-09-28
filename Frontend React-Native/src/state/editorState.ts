export type ElementType = 'text' | 'image' | 'sticker' | 'shape' | 'drawing';

export type ElementStyle = {
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | '300' | '400' | '500' | '600' | '700' | '800';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  opacity?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  strokeColor?: string;
  strokeWidth?: number;
  shapeType?: 'rectangle' | 'rounded' | 'circle' | 'ribbon' | 'badge' | 'nameplate' | 'line';
};

export type EditorElement = {
  id: string;
  type: ElementType;
  label: string;
  content: string; // text string, image URL, svg/shape icon name, or drawing data
  position: { x: number; y: number }; // normalized percentages 0-100% relative to canvas center
  size: { width: number; height: number }; // normalized percentages
  rotation?: number; // degrees 0-360
  opacity?: number; // 0 to 1
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  style?: ElementStyle;
};

export type DrawingPoint = {
  x: number;
  y: number;
};

export type DrawingStroke = {
  id: string;
  points: DrawingPoint[];
  color: string;
  width: number;
};

export type CanvasSizePreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  aspectRatio: number;
  icon: string;
};

export const CANVAS_SIZE_PRESETS: CanvasSizePreset[] = [
  { id: 'portrait', label: 'Portrait (4:5)', width: 1080, height: 1350, aspectRatio: 1080 / 1350, icon: '📱' },
  { id: 'square', label: 'Square (1:1)', width: 1080, height: 1080, aspectRatio: 1, icon: '⏹️' },
  { id: 'story', label: 'Story / Status (9:16)', width: 1080, height: 1920, aspectRatio: 1080 / 1920, icon: '📲' },
  { id: 'landscape', label: 'Landscape (16:9)', width: 1200, height: 675, aspectRatio: 1200 / 675, icon: '🖼️' },
  { id: 'social_banner', label: 'Social Banner', width: 1200, height: 630, aspectRatio: 1200 / 630, icon: '📢' }
];

export type EditorBackground = {
  type: 'solid' | 'gradient' | 'image';
  color: string;
  gradientColors?: string[];
  gradientAngle?: number;
  imageUrl?: string;
};

export type EditorSnapshot = {
  elements: EditorElement[];
  background: EditorBackground;
  canvasWidth: number;
  canvasHeight: number;
  sizePreset: string;
  drawingStrokes: DrawingStroke[];
};

export const createDefaultEditorState = (
  initialWidth = 1080,
  initialHeight = 1350
): EditorSnapshot => ({
  elements: [],
  background: {
    type: 'solid',
    color: '#F8FAFC'
  },
  canvasWidth: initialWidth,
  canvasHeight: initialHeight,
  sizePreset: 'portrait',
  drawingStrokes: []
});
