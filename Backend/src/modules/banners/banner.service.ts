import mongoose from 'mongoose';
import { AppError } from '../../utils/appError';
import {
  IBannerBackground,
  IBannerCanvas,
  IBannerElement,
  Template
} from '../templates/template.model';
import { Banner, IBanner } from './banner.model';

export type PopulatedTemplate = {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  canvas: IBannerCanvas;
  background: IBannerBackground;
  elements: IBannerElement[];
  socialContent?: any;
  editableFields?: any[];
  isActive: boolean;
};

export type BannerDTO = {
  id: string;
  userId: string;
  templateId: string;
  title: string;
  canvas: IBannerCanvas;
  background: IBannerBackground;
  elements: IBannerElement[];
  template?: PopulatedTemplate;
  fields: any[];
  mainText: string;
  secondaryText: string;
  createdAt: string;
  updatedAt: string;
};

const mapBannerToDTO = (doc: any): BannerDTO => {
  const json = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
  let templateObj: PopulatedTemplate | undefined = undefined;

  if (doc.templateId && typeof doc.templateId === 'object' && doc.templateId._id) {
    templateObj = {
      id: doc.templateId._id.toString(),
      title: doc.templateId.title,
      category: doc.templateId.category,
      imageUrl: doc.templateId.imageUrl,
      canvas: doc.templateId.canvas || { width: 1080, height: 1350, sizePreset: 'Portrait' },
      background: doc.templateId.background || { type: 'image', source: doc.templateId.imageUrl, color: '#0f172a' },
      elements: doc.templateId.elements || [],
      socialContent: doc.templateId.socialContent,
      editableFields: doc.templateId.editableFields || [],
      isActive: doc.templateId.isActive
    };
  }

  let elements: IBannerElement[] = json.elements || doc.elements || [];
  const canvas: IBannerCanvas = json.canvas || templateObj?.canvas || {
    width: 1080,
    height: 1350,
    sizePreset: 'Portrait'
  };
  const background: IBannerBackground = json.background || templateObj?.background || {
    type: 'image',
    source: templateObj?.imageUrl || '',
    color: '#0f172a'
  };

  // Legacy fallback if elements is empty but fields exist
  if (elements.length === 0 && (json.fields?.length || doc.fields?.length)) {
    const rawFields = json.fields || doc.fields;
    elements = rawFields.map((f: any, idx: number) => ({
      id: f.fieldId || `element_${idx}`,
      type: 'text',
      label: f.label || `Field ${idx + 1}`,
      content: f.value || '',
      position: f.position || { x: 50, y: Math.min(20 + idx * 25, 85) },
      size: { width: 70, height: 10 },
      style: f.style || {
        fontFamily: 'Modern',
        fontSize: 22,
        color: '#FFFFFF',
        alignment: 'center'
      },
      required: true,
      editable: true,
      movable: true,
      resizable: false,
      locked: false,
      zIndex: idx + 1,
      visible: true
    }));
  }

  // Synthesize legacy fields array from elements
  const fields = elements
    .filter((e) => e.type === 'text')
    .map((e) => ({
      fieldId: e.id,
      label: e.label,
      value: e.content || '',
      style: e.style || { fontFamily: 'Modern', fontSize: 22, color: '#FFFFFF', alignment: 'center' },
      position: e.position
    }));

  const mainText = json.mainText || doc.mainText || fields[0]?.value || elements[0]?.content || '';
  const secondaryText = json.secondaryText || doc.secondaryText || fields[1]?.value || elements[1]?.content || '';
  const title = json.title || doc.title || (fields[0]?.value ? `${fields[0].value} Banner` : 'Custom Banner');

  return {
    id: json.id || (doc._id ? doc._id.toString() : ''),
    userId: doc.userId ? doc.userId.toString() : json.userId,
    templateId: templateObj ? templateObj.id : (doc.templateId ? doc.templateId.toString() : json.templateId),
    title,
    canvas,
    background,
    elements,
    template: templateObj,
    fields,
    mainText,
    secondaryText,
    createdAt: json.createdAt ? new Date(json.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: json.updatedAt ? new Date(json.updatedAt).toISOString() : new Date().toISOString()
  };
};

export const getUserBanners = async (userId: string): Promise<BannerDTO[]> => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError('Invalid user ID.', 400);
  }

  const banners = await Banner.find({ userId })
    .populate(
      'templateId',
      'title category imageUrl canvas background elements socialContent editableFields isActive'
    )
    .sort({ createdAt: -1 });

  return banners.map(mapBannerToDTO);
};

export const getBannerById = async (id: string, userId: string): Promise<BannerDTO> => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Banner not found.', 404);
  }

  const banner = await Banner.findById(id).populate(
    'templateId',
    'title category imageUrl canvas background elements socialContent editableFields isActive'
  );
  if (!banner) {
    throw new AppError('Banner not found.', 404);
  }

  if (banner.userId.toString() !== userId) {
    throw new AppError('Access denied. You do not own this banner.', 403);
  }

  return mapBannerToDTO(banner);
};

export const createBanner = async (data: {
  userId: string;
  templateId: string;
  title?: string;
  canvas?: IBannerCanvas;
  background?: IBannerBackground;
  elements?: IBannerElement[];
  fields?: any[];
  mainText?: string;
  secondaryText?: string;
}): Promise<BannerDTO> => {
  if (!data.userId || !mongoose.isValidObjectId(data.userId)) {
    throw new AppError('Valid user ID is required.', 400);
  }
  if (!data.templateId || !mongoose.isValidObjectId(data.templateId)) {
    throw new AppError('Valid template ID is required.', 400);
  }

  // Ensure template exists
  const template = await Template.findById(data.templateId);
  if (!template) {
    throw new AppError('Template not found.', 404);
  }

  let finalElements: IBannerElement[] = [];

  if (data.elements && Array.isArray(data.elements) && data.elements.length > 0) {
    // Validate required elements from template definition
    for (const te of template.elements || []) {
      if (te.required) {
        const submitted = data.elements.find((e) => e.id === te.id);
        if (te.type === 'text') {
          if (!submitted || !submitted.content || !submitted.content.trim()) {
            throw new AppError(`Please enter ${te.label}.`, 400);
          }
        } else if (te.type === 'image' || te.type === 'symbol' || te.type === 'logo') {
          if (!submitted || (!submitted.source && !te.source)) {
            throw new AppError(`Please provide ${te.label}.`, 400);
          }
        }
      }
    }

    finalElements = data.elements.map((e) => {
      const templateEl = (template.elements || []).find((te) => te.id === e.id);
      return {
        id: e.id,
        type: e.type,
        label: e.label || templateEl?.label || e.id,
        content: (e.content || '').trim(),
        source: e.source || templateEl?.source || '',
        position: e.position || templateEl?.position || { x: 50, y: 50 },
        size: e.size || templateEl?.size || { width: 60, height: 15 },
        style: e.style || templateEl?.style || {
          fontFamily: 'Modern',
          fontSize: 22,
          color: '#FFFFFF',
          alignment: 'center'
        },
        required: templateEl?.required !== undefined ? templateEl.required : Boolean(e.required),
        editable: templateEl?.editable !== undefined ? templateEl.editable : true,
        movable: templateEl?.movable !== undefined ? templateEl.movable : true,
        resizable: templateEl?.resizable !== undefined ? templateEl.resizable : false,
        locked: templateEl?.locked !== undefined ? templateEl.locked : false,
        zIndex: e.zIndex !== undefined ? e.zIndex : (templateEl?.zIndex || 1),
        visible: e.visible !== undefined ? e.visible : true
      };
    });
  } else if (data.fields && Array.isArray(data.fields) && data.fields.length > 0) {
    // Legacy fields array payload
    const templateFields =
      template.elements && template.elements.length > 0
        ? template.elements
        : template.editableFields || [];

    for (const tf of templateFields) {
      const submitted = data.fields.find((f) => f.fieldId === tf.id);
      if (tf.required && (!submitted || !submitted.value || !submitted.value.trim())) {
        throw new AppError(`Please enter ${tf.label}.`, 400);
      }
    }

    finalElements = data.fields.map((f, idx) => ({
      id: f.fieldId || `element_${idx}`,
      type: 'text' as const,
      label: f.label || `Field ${idx + 1}`,
      content: (f.value || '').trim(),
      position: f.position || { x: 50, y: Math.min(20 + idx * 25, 85) },
      size: { width: 70, height: 10 },
      style: f.style || {
        fontFamily: 'Modern',
        fontSize: 22,
        color: '#FFFFFF',
        alignment: 'center'
      },
      required: true,
      editable: true,
      movable: true,
      resizable: false,
      locked: false,
      zIndex: idx + 1,
      visible: true
    }));
  } else if (data.mainText !== undefined) {
    // Legacy mainText/secondaryText payload
    if (!data.mainText.trim()) {
      throw new AppError('Please enter the main text.', 400);
    }

    finalElements = [
      {
        id: 'main_text',
        type: 'text' as const,
        label: 'Main Text',
        content: data.mainText.trim(),
        position: { x: 50, y: 35 },
        size: { width: 75, height: 12 },
        style: { fontFamily: 'Modern', fontSize: 26, color: '#FFFFFF', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        zIndex: 1,
        visible: true
      }
    ];

    if (data.secondaryText && data.secondaryText.trim()) {
      finalElements.push({
        id: 'secondary_text',
        type: 'text' as const,
        label: 'Secondary Text',
        content: data.secondaryText.trim(),
        position: { x: 50, y: 70 },
        size: { width: 75, height: 10 },
        style: { fontFamily: 'Modern', fontSize: 16, color: '#F3F4F6', alignment: 'center' },
        required: false,
        editable: true,
        movable: true,
        zIndex: 2,
        visible: true
      });
    }
  } else {
    throw new AppError('Banner elements or content are required.', 400);
  }

  const canvas: IBannerCanvas = data.canvas || template.canvas || {
    width: 1080,
    height: 1350,
    sizePreset: 'Portrait'
  };

  const background: IBannerBackground = data.background || template.background || {
    type: 'image',
    source: template.imageUrl,
    color: '#0f172a'
  };

  const mainTextVal =
    data.mainText?.trim() ||
    finalElements.find((e) => e.type === 'text')?.content ||
    '';

  const secondaryTextVal =
    data.secondaryText?.trim() ||
    finalElements.filter((e) => e.type === 'text')[1]?.content ||
    '';

  const bannerTitle =
    data.title?.trim() ||
    (mainTextVal ? `${mainTextVal} Banner` : `${template.title} Customized`);

  // Create separate User Design instance (Template Integrity preserved)
  const banner = await Banner.create({
    userId: new mongoose.Types.ObjectId(data.userId),
    templateId: new mongoose.Types.ObjectId(data.templateId),
    title: bannerTitle,
    canvas,
    background,
    elements: finalElements,
    mainText: mainTextVal,
    secondaryText: secondaryTextVal
  });

  const populated = await Banner.findById(banner._id).populate(
    'templateId',
    'title category imageUrl canvas background elements socialContent editableFields isActive'
  );
  return mapBannerToDTO(populated || banner);
};

export const updateBanner = async (
  id: string,
  userId: string,
  data: {
    title?: string;
    canvas?: IBannerCanvas;
    background?: IBannerBackground;
    elements?: IBannerElement[];
    fields?: any[];
    mainText?: string;
    secondaryText?: string;
  }
): Promise<BannerDTO> => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Banner not found.', 404);
  }

  const banner = await Banner.findById(id);
  if (!banner) {
    throw new AppError('Banner not found.', 404);
  }

  if (banner.userId.toString() !== userId) {
    throw new AppError('Access denied. You do not own this banner.', 403);
  }

  if (data.title !== undefined) banner.title = data.title;
  if (data.canvas !== undefined) banner.canvas = data.canvas;
  if (data.background !== undefined) banner.background = data.background;
  if (data.elements !== undefined) banner.elements = data.elements;
  if (data.mainText !== undefined) banner.mainText = data.mainText;
  if (data.secondaryText !== undefined) banner.secondaryText = data.secondaryText;

  await banner.save();

  const populated = await Banner.findById(banner._id).populate(
    'templateId',
    'title category imageUrl canvas background elements socialContent editableFields isActive'
  );
  return mapBannerToDTO(populated || banner);
};

export const deleteBanner = async (id: string, userId: string): Promise<BannerDTO> => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Banner not found.', 404);
  }

  const banner = await Banner.findById(id);
  if (!banner) {
    throw new AppError('Banner not found.', 404);
  }

  if (banner.userId.toString() !== userId) {
    throw new AppError('Access denied. You do not own this banner.', 403);
  }

  await Banner.findByIdAndDelete(id);
  return mapBannerToDTO(banner);
};

