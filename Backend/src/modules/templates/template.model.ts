import mongoose, { Document, Schema } from 'mongoose';

export const BANNER_SIZE_PRESETS = [
  'Square', // 1080x1080 (1:1)
  'Portrait', // 1080x1350 (4:5)
  'Story', // 1080x1920 (9:16)
  'Landscape', // 1920x1080 (16:9)
  'Custom'
] as const;

export type BannerSizePreset = (typeof BANNER_SIZE_PRESETS)[number];

export const TEMPLATE_CATEGORIES = [
  'Politics',
  'Business',
  'Education',
  'Events',
  'Festival',
  'Birthday',
  'Other'
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number] | string;

export type BannerElementType = 'text' | 'image' | 'logo' | 'symbol';

export interface IBannerElementStyle {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  alignment?: 'left' | 'center' | 'right';
  borderRadius?: number;
  opacity?: number;
}

export interface IBannerElement {
  id: string;
  type: BannerElementType;
  label: string;
  content?: string; // Text content
  source?: string; // Image / Logo / Symbol URL
  position: {
    x: number; // percentage 0-100 (relative to canvas width)
    y: number; // percentage 0-100 (relative to canvas height)
  };
  size: {
    width: number; // percentage 0-100
    height?: number; // percentage or auto
  };
  style?: IBannerElementStyle;
  required?: boolean;
  editable?: boolean; // User can change text/replace image
  movable?: boolean; // User can drag element
  resizable?: boolean; // User can resize element
  locked?: boolean; // Admin locked (no user changes)
  zIndex: number;
  visible?: boolean;
}

export interface IBannerCanvas {
  width: number;
  height: number;
  sizePreset: BannerSizePreset | string;
}

export interface IBannerBackground {
  type: 'image' | 'color';
  source?: string;
  color?: string;
}

export interface IPlatformSocialContent {
  caption?: string;
  hashtags?: string[];
  extraFields?: Record<string, any>;
}

export interface ITemplateSocialContent {
  facebook?: IPlatformSocialContent;
  instagram?: IPlatformSocialContent;
  x?: IPlatformSocialContent;
  threads?: IPlatformSocialContent;
}

export interface ITemplate extends Document {
  title: string;
  category: string;
  imageUrl: string;
  canvas: IBannerCanvas;
  background: IBannerBackground;
  elements: IBannerElement[];
  socialContent?: ITemplateSocialContent;
  editableFields?: any[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bannerElementSchema = new Schema<IBannerElement>(
  {
    id: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['text', 'image', 'logo', 'symbol'],
      default: 'text'
    },
    label: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    source: { type: String, default: '' },
    position: {
      x: { type: Number, default: 50 },
      y: { type: Number, default: 50 }
    },
    size: {
      width: { type: Number, default: 60 },
      height: { type: Number, default: 15 }
    },
    style: {
      fontFamily: { type: String, default: 'Modern' },
      fontSize: { type: Number, default: 22 },
      color: { type: String, default: '#FFFFFF' },
      alignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
      borderRadius: { type: Number, default: 0 },
      opacity: { type: Number, default: 1 }
    },
    required: { type: Boolean, default: false },
    editable: { type: Boolean, default: true },
    movable: { type: Boolean, default: true },
    resizable: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    zIndex: { type: Number, default: 1 },
    visible: { type: Boolean, default: true }
  },
  { _id: false }
);

const platformSocialContentSchema = new Schema<IPlatformSocialContent>(
  {
    caption: { type: String, default: '', trim: true },
    hashtags: { type: [String], default: [] },
    extraFields: { type: Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const templateSocialContentSchema = new Schema<ITemplateSocialContent>(
  {
    facebook: { type: platformSocialContentSchema, default: () => ({}) },
    instagram: { type: platformSocialContentSchema, default: () => ({}) },
    x: { type: platformSocialContentSchema, default: () => ({}) },
    threads: { type: platformSocialContentSchema, default: () => ({}) }
  },
  { _id: false }
);

const templateSchema = new Schema<ITemplate>(
  {
    title: {
      type: String,
      required: [true, 'Template title is required'],
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    category: {
      type: String,
      required: [true, 'Template category is required'],
      trim: true
    },
    imageUrl: {
      type: String,
      required: [true, 'Template image URL is required'],
      trim: true
    },
    canvas: {
      width: { type: Number, default: 1080 },
      height: { type: Number, default: 1350 },
      sizePreset: { type: String, default: 'Portrait' }
    },
    background: {
      type: { type: String, default: 'image' },
      source: { type: String, default: '' },
      color: { type: String, default: '#0f172a' }
    },
    elements: {
      type: [bannerElementSchema],
      default: []
    },
    socialContent: {
      type: templateSocialContentSchema,
      default: () => ({
        facebook: { caption: '', hashtags: [] },
        instagram: { caption: '', hashtags: [] },
        x: { caption: '', hashtags: [] },
        threads: { caption: '', hashtags: [] }
      })
    },
    editableFields: {
      type: [Schema.Types.Mixed],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Map _id to id and remove internal mongoose fields in JSON
templateSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Template = mongoose.model<ITemplate>('Template', templateSchema);
