export type CanvasPreset = {
  name: string;
  width: number;
  height: number;
};

export type DesignElement = {
  id: string;
  type: string; // e.g., 'image', 'text', 'shape'
  x: number; // left coordinate (relative to canvas)
  y: number; // top coordinate (relative to canvas)
  width: number;
  height: number;
  rotation?: number;
  // additional properties can be added as needed
};

export type Design = {
  preset: CanvasPreset;
  elements: DesignElement[];
};
