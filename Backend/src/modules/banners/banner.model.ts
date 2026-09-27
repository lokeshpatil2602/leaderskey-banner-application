import mongoose, { Document, Schema } from 'mongoose';
import { IBannerBackground, IBannerCanvas, IBannerElement } from '../templates/template.model';

export interface IBanner extends Document {
  userId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  title: string;
  canvas: IBannerCanvas;
  background: IBannerBackground;
  elements: IBannerElement[];
  // Legacy compatibility helpers
  fields?: any[];
  mainText?: string;
  secondaryText?: string;
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

const bannerSchema = new Schema<IBanner>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template',
      required: [true, 'Template ID is required']
    },
    title: {
      type: String,
      trim: true,
      default: 'Custom Banner'
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
    // Optional legacy helper fields for backwards compatibility
    fields: {
      type: [Schema.Types.Mixed],
      default: []
    },
    mainText: {
      type: String,
      trim: true,
      default: ''
    },
    secondaryText: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Map _id to id and remove internal mongoose fields in JSON
bannerSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Banner = mongoose.model<IBanner>('Banner', bannerSchema);
