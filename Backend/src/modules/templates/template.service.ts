import mongoose from 'mongoose';
import { AppError } from '../../utils/appError';
import {
  BannerSizePreset,
  IBannerBackground,
  IBannerCanvas,
  IBannerElement,
  ITemplate,
  ITemplateSocialContent,
  Template
} from './template.model';

export type TemplateDTO = {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  canvas: IBannerCanvas;
  background: IBannerBackground;
  elements: IBannerElement[];
  socialContent?: ITemplateSocialContent;
  editableFields?: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_IMAGE_URL = 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800';

export const CANVAS_SIZE_PRESETS: Record<BannerSizePreset, { width: number; height: number }> = {
  Square: { width: 1080, height: 1080 },
  Portrait: { width: 1080, height: 1350 },
  Story: { width: 1080, height: 1920 },
  Landscape: { width: 1920, height: 1080 },
  Custom: { width: 1080, height: 1080 }
};

const SEED_TEMPLATES = [
  // 1. Politics Portrait (1080 x 1350)
  {
    title: 'Political Rally Banner',
    category: 'Politics',
    imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop&q=80',
    canvas: { width: 1080, height: 1350, sizePreset: 'Portrait' },
    background: {
      type: 'image' as const,
      source: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop&q=80',
      color: '#0f172a'
    },
    elements: [
      {
        id: 'party_logo',
        type: 'logo' as const,
        label: 'Party Logo',
        source: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        position: { x: 16, y: 10 },
        size: { width: 18, height: 14 },
        locked: true,
        editable: false,
        movable: false,
        resizable: false,
        zIndex: 2
      },
      {
        id: 'party_symbol',
        type: 'symbol' as const,
        label: 'Party Symbol',
        source: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        position: { x: 84, y: 10 },
        size: { width: 18, height: 14 },
        locked: false,
        editable: true,
        movable: true,
        resizable: true,
        zIndex: 2
      },
      {
        id: 'main_heading',
        type: 'text' as const,
        label: 'Main Heading',
        content: 'GRAND VICTORY RALLY 2026',
        position: { x: 50, y: 22 },
        size: { width: 85, height: 10 },
        style: { fontFamily: 'Impact', fontSize: 26, color: '#FFFFFF', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        resizable: false,
        zIndex: 3
      },
      {
        id: 'candidate_photo',
        type: 'image' as const,
        label: 'Candidate Photo',
        source: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        position: { x: 50, y: 48 },
        size: { width: 44, height: 35 },
        style: { borderRadius: 16 },
        required: true,
        editable: true,
        movable: true,
        resizable: true,
        zIndex: 2
      },
      {
        id: 'candidate_name',
        type: 'text' as const,
        label: 'Candidate Name',
        content: 'Hon. Meet Sanwadkar',
        position: { x: 50, y: 72 },
        size: { width: 80, height: 8 },
        style: { fontFamily: 'Modern', fontSize: 28, color: '#FDE68A', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        resizable: false,
        zIndex: 4
      },
      {
        id: 'designation',
        type: 'text' as const,
        label: 'Designation',
        content: 'Member of Parliament Candidate',
        position: { x: 50, y: 80 },
        size: { width: 75, height: 6 },
        style: { fontFamily: 'Modern', fontSize: 16, color: '#93C5FD', alignment: 'center' },
        required: false,
        editable: true,
        movable: true,
        resizable: false,
        zIndex: 4
      },
      {
        id: 'date_time',
        type: 'text' as const,
        label: 'Date & Time',
        content: '28 October 2026 • 5:00 PM',
        position: { x: 50, y: 90 },
        size: { width: 80, height: 6 },
        style: { fontFamily: 'Typewriter', fontSize: 14, color: '#FFFFFF', alignment: 'center' },
        required: true,
        editable: true,
        movable: false,
        resizable: false,
        zIndex: 4
      }
    ],
    socialContent: {
      facebook: {
        caption: 'Join us live for the Grand Victory Rally 2026! Together for progress and community empowerment.',
        hashtags: ['#VictoryRally2026', '#CommunityFirst', '#Election2026']
      },
      instagram: {
        caption: 'Honored to invite everyone to our upcoming Mega Rally! Let our collective voices shape the future. 🇮🇳✨',
        hashtags: ['#MegaRally', '#LeaderOfPeople', '#YouthPower', '#FutureReady', '#MumbaiRally']
      },
      x: {
        caption: 'Excited to announce our Grand Victory Rally 2026! Mark your calendars for 28th October at 5 PM.',
        hashtags: ['#VictoryRally', '#Leadership']
      },
      threads: {
        caption: 'Big announcement! Grand Victory Rally 2026 is happening on 28th October. Let us build a better tomorrow together.',
        hashtags: ['#Election2026', '#Rally', '#Democracy']
      }
    },
    isActive: true
  },

  // 2. Festival Story (1080 x 1920)
  {
    title: 'Diwali Festival Greetings',
    category: 'Festival',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    canvas: { width: 1080, height: 1920, sizePreset: 'Story' },
    background: {
      type: 'image' as const,
      source: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      color: '#1e1b4b'
    },
    elements: [
      {
        id: 'festival_symbol',
        type: 'symbol' as const,
        label: 'Diyas Symbol',
        source: 'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?w=200&auto=format&fit=crop&q=80',
        position: { x: 50, y: 15 },
        size: { width: 22, height: 12 },
        locked: false,
        editable: true,
        movable: true,
        resizable: true,
        zIndex: 2
      },
      {
        id: 'festival_heading',
        type: 'text' as const,
        label: 'Festival Title',
        content: 'HAPPY DIWALI',
        position: { x: 50, y: 28 },
        size: { width: 85, height: 8 },
        style: { fontFamily: 'Impact', fontSize: 32, color: '#FDE68A', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        resizable: false,
        zIndex: 3
      },
      {
        id: 'greeting_msg',
        type: 'text' as const,
        label: 'Greeting Message',
        content: 'May the divine light illuminate your life with joy and prosperity!',
        position: { x: 50, y: 40 },
        size: { width: 80, height: 12 },
        style: { fontFamily: 'Casual', fontSize: 18, color: '#FFFFFF', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        resizable: false,
        zIndex: 3
      },
      {
        id: 'sender_photo',
        type: 'image' as const,
        label: 'Sender Photo',
        source: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
        position: { x: 50, y: 68 },
        size: { width: 38, height: 21 },
        style: { borderRadius: 100 },
        required: false,
        editable: true,
        movable: true,
        resizable: true,
        zIndex: 2
      },
      {
        id: 'sender_name',
        type: 'text' as const,
        label: 'From (Your Name)',
        content: 'With Best Wishes from Sanwadkar Family',
        position: { x: 50, y: 88 },
        size: { width: 85, height: 6 },
        style: { fontFamily: 'Modern', fontSize: 18, color: '#FDE68A', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        resizable: false,
        zIndex: 4
      }
    ],
    socialContent: {
      facebook: {
        caption: 'Wishing you and your family a very Happy and Prosperous Diwali! 🪔✨ May your life be filled with happiness and health.',
        hashtags: ['#HappyDiwali', '#FestivalOfLights', '#DiwaliCelebration']
      },
      instagram: {
        caption: 'Diwali vibes! ✨ Wishing joy, love, and sweet memories to all our friends and family. 🪔💫',
        hashtags: ['#Diwali2026', '#FestivalVibes', '#LightsAndJoy', '#FestiveSeason', '#Blessings']
      },
      x: {
        caption: 'Happy Diwali to everyone celebrating! May this festival bring peace, prosperity, and radiant joy. 🪔',
        hashtags: ['#HappyDiwali', '#Diwali']
      },
      threads: {
        caption: 'Warmest Diwali greetings from our family to yours! May the lights guide you towards success and peace.',
        hashtags: ['#Diwali', '#FestiveGreetings']
      }
    },
    isActive: true
  },

  // 3. Business Landscape (1920 x 1080)
  {
    title: 'Business Product Launch',
    category: 'Business',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    canvas: { width: 1920, height: 1080, sizePreset: 'Landscape' },
    background: {
      type: 'image' as const,
      source: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
      color: '#0f172a'
    },
    elements: [
      {
        id: 'company_logo',
        type: 'logo' as const,
        label: 'Company Logo',
        source: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        position: { x: 12, y: 15 },
        size: { width: 14, height: 20 },
        locked: true,
        editable: false,
        movable: false,
        resizable: false,
        zIndex: 2
      },
      {
        id: 'headline',
        type: 'text' as const,
        label: 'Headline',
        content: 'NEXT-GEN CLOUD PLATFORM',
        position: { x: 50, y: 25 },
        size: { width: 70, height: 12 },
        style: { fontFamily: 'Impact', fontSize: 32, color: '#FFFFFF', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        zIndex: 3
      },
      {
        id: 'special_offer',
        type: 'text' as const,
        label: 'Special Offer',
        content: 'Get 50% OFF on Annual Enterprise Subscription',
        position: { x: 50, y: 48 },
        size: { width: 65, height: 10 },
        style: { fontFamily: 'Modern', fontSize: 20, color: '#34D399', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        zIndex: 3
      },
      {
        id: 'cta_btn',
        type: 'text' as const,
        label: 'Call to Action',
        content: 'Start Free Trial • Visit enterprise.com',
        position: { x: 50, y: 78 },
        size: { width: 60, height: 10 },
        style: { fontFamily: 'Typewriter', fontSize: 16, color: '#FFFFFF', alignment: 'center' },
        required: false,
        editable: true,
        movable: false,
        zIndex: 3
      }
    ],
    socialContent: {
      facebook: {
        caption: '🚀 We are thrilled to launch our next-generation cloud platform! Supercharge your enterprise productivity today.',
        hashtags: ['#CloudComputing', '#EnterpriseSaaS', '#TechLaunch']
      },
      instagram: {
        caption: 'The future of cloud infrastructure is here. Elevate your team workflow with unprecedented speed and security. 💡⚡',
        hashtags: ['#ProductLaunch', '#TechInnovation', '#EnterpriseTech', '#CloudPlatform', '#ScaleUp']
      },
      x: {
        caption: 'Excited to unveil our next-gen cloud platform! Claim your 50% launch discount now:',
        hashtags: ['#CloudPlatform', '#SaaS']
      },
      threads: {
        caption: 'Next-gen enterprise cloud is officially live! Scale faster with zero friction. Check out the link in bio.',
        hashtags: ['#Cloud', '#DevOps', '#Enterprise']
      }
    },
    isActive: true
  },

  // 4. Birthday Square (1080 x 1080)
  {
    title: 'Birthday Celebration Banner',
    category: 'Birthday',
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80',
    canvas: { width: 1080, height: 1080, sizePreset: 'Square' },
    background: {
      type: 'image' as const,
      source: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80',
      color: '#1e1b4b'
    },
    elements: [
      {
        id: 'birthday_title',
        type: 'text' as const,
        label: 'Header Title',
        content: 'HAPPY BIRTHDAY',
        position: { x: 50, y: 16 },
        size: { width: 80, height: 10 },
        style: { fontFamily: 'Impact', fontSize: 30, color: '#FCD34D', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        zIndex: 3
      },
      {
        id: 'birthday_person_photo',
        type: 'image' as const,
        label: 'Celebrant Photo',
        source: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        position: { x: 50, y: 46 },
        size: { width: 44, height: 44 },
        style: { borderRadius: 100 },
        required: true,
        editable: true,
        movable: true,
        resizable: true,
        zIndex: 2
      },
      {
        id: 'person_name',
        type: 'text' as const,
        label: 'Celebrant Name',
        content: 'Meet Patel',
        position: { x: 50, y: 76 },
        size: { width: 75, height: 8 },
        style: { fontFamily: 'Modern', fontSize: 28, color: '#FFFFFF', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        zIndex: 3
      },
      {
        id: 'birthday_age',
        type: 'text' as const,
        label: 'Turning Age',
        content: 'Turning 21 Today! 🎂',
        position: { x: 50, y: 88 },
        size: { width: 70, height: 6 },
        style: { fontFamily: 'Casual', fontSize: 18, color: '#FDE68A', alignment: 'center' },
        required: false,
        editable: true,
        movable: true,
        zIndex: 3
      }
    ],
    socialContent: {
      facebook: {
        caption: 'Happy Birthday! 🎉 Wishing you endless joy, great health, and tremendous success in the year ahead!',
        hashtags: ['#HappyBirthday', '#CelebrationTime', '#BirthdayVibes']
      },
      instagram: {
        caption: 'Another year bolder, wiser, and more wonderful! 🎂✨ Happy Birthday! Drop your birthday wishes below 👇',
        hashtags: ['#BirthdayCelebration', '#CheersToAnotherYear', '#Turning21', '#PartyTime']
      },
      x: {
        caption: 'Wishing a very Happy Birthday! May your day be filled with laughter and love! 🎈🎂',
        hashtags: ['#HappyBirthday']
      },
      threads: {
        caption: 'Happy Birthday! May this upcoming year bring you happiness, blessings, and memorable adventures. 🎉',
        hashtags: ['#Birthday', '#Celebration']
      }
    },
    isActive: true
  }
];

export const seedInitialTemplates = async (): Promise<void> => {
  try {
    const count = await Template.countDocuments();
    if (count === 0) {
      await Template.insertMany(SEED_TEMPLATES);
      console.log('Seeded initial multi-size banner templates with social content into MongoDB.');
    } else {
      for (const seed of SEED_TEMPLATES) {
        const existing = await Template.findOne({ title: seed.title });
        if (existing) {
          existing.canvas = seed.canvas;
          existing.background = seed.background;
          existing.elements = seed.elements as any;
          existing.socialContent = seed.socialContent as any;
          existing.markModified('socialContent');
          existing.markModified('canvas');
          existing.markModified('elements');
          await existing.save();
        } else {
          await Template.create(seed);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to check or seed initial templates:', error instanceof Error ? error.message : error);
  }
};

const mapTemplateToDTO = (doc: ITemplate): TemplateDTO => {
  const json = doc.toJSON();
  const canvas: IBannerCanvas = json.canvas || {
    width: 1080,
    height: 1350,
    sizePreset: 'Portrait'
  };

  const background: IBannerBackground = json.background || {
    type: 'image',
    source: json.imageUrl,
    color: '#0f172a'
  };

  let elements: IBannerElement[] = json.elements || [];

  // If elements array is empty but legacy editableFields exist, synthesize elements
  if (elements.length === 0 && json.editableFields && json.editableFields.length > 0) {
    elements = json.editableFields.map((f: any, idx: number) => ({
      id: f.id,
      type: 'text',
      label: f.label,
      content: f.label,
      position: f.defaultPosition || { x: 50, y: Math.min(20 + idx * 25, 85) },
      size: { width: 70, height: 10 },
      style: f.defaultStyle || {
        fontFamily: 'Modern',
        fontSize: 22,
        color: '#FFFFFF',
        alignment: 'center'
      },
      required: Boolean(f.required),
      editable: true,
      movable: f.movable !== undefined ? Boolean(f.movable) : true,
      resizable: false,
      locked: false,
      zIndex: idx + 1,
      visible: true
    }));
  }

  // Synthesize legacy editableFields from elements for backward compatibility
  const editableFields = elements
    .filter((e) => e.type === 'text')
    .map((e) => ({
      id: e.id,
      label: e.label,
      type: 'text',
      required: Boolean(e.required),
      movable: Boolean(e.movable),
      defaultStyle: e.style,
      defaultPosition: e.position
    }));

  const socialContent: ITemplateSocialContent = json.socialContent || {
    facebook: { caption: '', hashtags: [] },
    instagram: { caption: '', hashtags: [] },
    x: { caption: '', hashtags: [] },
    threads: { caption: '', hashtags: [] }
  };

  return {
    id: json.id,
    title: json.title,
    category: json.category,
    imageUrl: json.imageUrl,
    canvas,
    background,
    elements,
    socialContent,
    editableFields,
    isActive: json.isActive,
    createdAt: json.createdAt ? new Date(json.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: json.updatedAt ? new Date(json.updatedAt).toISOString() : new Date().toISOString()
  };
};

export const getAllTemplates = async (
  category?: string,
  size?: string,
  includeInactive = false
): Promise<TemplateDTO[]> => {
  const count = await Template.countDocuments();
  if (count === 0) {
    await seedInitialTemplates();
  }

  const query: Record<string, unknown> = {};

  if (!includeInactive) {
    query.isActive = true;
  }

  if (category && category.trim() && category.trim().toLowerCase() !== 'all') {
    query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
  }

  if (size && size.trim() && size.trim().toLowerCase() !== 'all') {
    query['canvas.sizePreset'] = { $regex: new RegExp(`^${size.trim()}$`, 'i') };
  }

  const templates = await Template.find(query).sort({ createdAt: -1 });
  return templates.map(mapTemplateToDTO);
};

export const getTemplateById = async (id: string): Promise<TemplateDTO> => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Template not found.', 404);
  }

  const template = await Template.findById(id);
  if (!template) {
    throw new AppError('Template not found.', 404);
  }
  return mapTemplateToDTO(template);
};

export const createTemplate = async (data: {
  title: string;
  category: string;
  imageUrl?: string;
  canvas?: IBannerCanvas;
  background?: IBannerBackground;
  elements?: IBannerElement[];
  socialContent?: ITemplateSocialContent;
  editableFields?: any[];
  isActive?: boolean;
}): Promise<TemplateDTO> => {
  if (!data.title || !data.title.trim()) {
    throw new AppError('Template title is required.', 400);
  }
  if (!data.category || !data.category.trim()) {
    throw new AppError('Template category is required.', 400);
  }

  const imageUrl = data.imageUrl?.trim() || DEFAULT_IMAGE_URL;

  // Resolve canvas size
  let canvas: IBannerCanvas = data.canvas || {
    width: 1080,
    height: 1350,
    sizePreset: 'Portrait'
  };

  if (data.canvas?.sizePreset && CANVAS_SIZE_PRESETS[data.canvas.sizePreset as BannerSizePreset]) {
    const preset = CANVAS_SIZE_PRESETS[data.canvas.sizePreset as BannerSizePreset];
    canvas = {
      width: data.canvas.width || preset.width,
      height: data.canvas.height || preset.height,
      sizePreset: data.canvas.sizePreset
    };
  }

  const background: IBannerBackground = data.background || {
    type: 'image',
    source: imageUrl,
    color: '#0f172a'
  };

  let elements: IBannerElement[] = data.elements || [];

  // If editableFields provided, convert to elements
  if (elements.length === 0 && data.editableFields && data.editableFields.length > 0) {
    elements = data.editableFields.map((f, idx) => ({
      id: f.id || `field_${idx}`,
      type: 'text',
      label: f.label || `Field ${idx + 1}`,
      content: f.label || '',
      position: f.defaultPosition || { x: 50, y: Math.min(20 + idx * 25, 85) },
      size: { width: 70, height: 10 },
      style: f.defaultStyle || {
        fontFamily: 'Modern',
        fontSize: 22,
        color: '#FFFFFF',
        alignment: 'center'
      },
      required: f.required !== undefined ? Boolean(f.required) : false,
      editable: true,
      movable: f.movable !== undefined ? Boolean(f.movable) : true,
      resizable: false,
      locked: false,
      zIndex: idx + 1,
      visible: true
    }));
  }

  if (elements.length === 0) {
    elements.push({
      id: 'heading',
      type: 'text',
      label: 'Main Heading',
      content: data.title,
      position: { x: 50, y: 30 },
      size: { width: 80, height: 12 },
      style: { fontFamily: 'Modern', fontSize: 26, color: '#FFFFFF', alignment: 'center' },
      required: true,
      editable: true,
      movable: true,
      resizable: false,
      locked: false,
      zIndex: 1,
      visible: true
    });
  }

  const socialContent: ITemplateSocialContent = data.socialContent || {
    facebook: { caption: '', hashtags: [] },
    instagram: { caption: '', hashtags: [] },
    x: { caption: '', hashtags: [] },
    threads: { caption: '', hashtags: [] }
  };

  const newTemplate = await Template.create({
    title: data.title.trim(),
    category: data.category.trim(),
    imageUrl,
    canvas,
    background,
    elements,
    socialContent,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
  });

  return mapTemplateToDTO(newTemplate);
};

export const updateTemplate = async (
  id: string,
  data: Partial<{
    title: string;
    category: string;
    imageUrl: string;
    canvas: IBannerCanvas;
    background: IBannerBackground;
    elements: IBannerElement[];
    socialContent: ITemplateSocialContent;
    editableFields: any[];
    isActive: boolean;
  }>
): Promise<TemplateDTO> => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Template not found.', 404);
  }

  const template = await Template.findById(id);
  if (!template) {
    throw new AppError('Template not found.', 404);
  }

  if (data.title !== undefined) {
    if (!data.title.trim()) throw new AppError('Template title cannot be empty.', 400);
    template.title = data.title.trim();
  }

  if (data.category !== undefined) {
    if (!data.category.trim()) throw new AppError('Template category cannot be empty.', 400);
    template.category = data.category.trim();
  }

  if (data.imageUrl !== undefined) {
    if (!data.imageUrl.trim()) throw new AppError('Template image URL cannot be empty.', 400);
    template.imageUrl = data.imageUrl.trim();
  }

  if (data.canvas !== undefined) {
    template.canvas = data.canvas;
  }

  if (data.background !== undefined) {
    template.background = data.background;
  }

  if (data.elements !== undefined) {
    template.elements = data.elements;
  } else if (data.editableFields !== undefined) {
    template.elements = data.editableFields.map((f, idx) => ({
      id: f.id || `field_${idx}`,
      type: 'text',
      label: f.label || `Field ${idx + 1}`,
      content: f.label || '',
      position: f.defaultPosition || { x: 50, y: Math.min(20 + idx * 25, 85) },
      size: { width: 70, height: 10 },
      style: f.defaultStyle || {
        fontFamily: 'Modern',
        fontSize: 22,
        color: '#FFFFFF',
        alignment: 'center'
      },
      required: f.required !== undefined ? Boolean(f.required) : false,
      editable: true,
      movable: f.movable !== undefined ? Boolean(f.movable) : true,
      resizable: false,
      locked: false,
      zIndex: idx + 1,
      visible: true
    }));
  }

  if (data.socialContent !== undefined) {
    template.socialContent = data.socialContent;
  }

  if (data.isActive !== undefined) {
    template.isActive = Boolean(data.isActive);
  }

  await template.save();
  return mapTemplateToDTO(template);
};

export const deleteTemplate = async (id: string): Promise<TemplateDTO> => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Template not found.', 404);
  }

  const template = await Template.findByIdAndDelete(id);
  if (!template) {
    throw new AppError('Template not found.', 404);
  }

  return mapTemplateToDTO(template);
};
