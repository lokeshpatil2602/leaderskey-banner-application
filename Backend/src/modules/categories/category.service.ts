import mongoose from 'mongoose';
import { AppError } from '../../utils/appError';
import { CategoryModel } from './category.model';

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
};

const initialCategories = [
  {
    name: 'E-Commerce',
    slug: 'e-commerce',
    description: 'Banners for online stores, discounts, sales, and seasonal deals.',
    icon: 'cart-outline'
  },
  {
    name: 'Events',
    slug: 'events',
    description: 'Conference, webinar, seminar, and party announcement banners.',
    icon: 'calendar-outline'
  },
  {
    name: 'Marketing',
    slug: 'marketing',
    description: 'Lead generation, branding campaigns, and advertising banners.',
    icon: 'megaphone-outline'
  },
  {
    name: 'Seasonal',
    slug: 'seasonal',
    description: 'Holiday greetings, festival specials, and new year banners.',
    icon: 'sparkles-outline'
  }
];

const seedCategoriesIfEmpty = async () => {
  try {
    const count = await CategoryModel.countDocuments();
    if (count === 0) {
      await CategoryModel.insertMany(initialCategories);
    }
  } catch (err) {
    // Ignore seeding error if index collision during race condition
  }
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toCategoryDTO = (doc: any): Category => {
  const json = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
  return {
    id: json.id || (doc._id ? doc._id.toString() : ''),
    name: doc.name || json.name,
    slug: doc.slug || json.slug,
    description: doc.description || json.description || '',
    icon: doc.icon || json.icon || 'folder-outline',
    createdAt: json.createdAt ? new Date(json.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: json.updatedAt ? new Date(json.updatedAt).toISOString() : new Date().toISOString()
  };
};

export const getAllCategories = async (): Promise<Category[]> => {
  await seedCategoriesIfEmpty();
  const docs = await CategoryModel.find().sort({ createdAt: 1 });
  return docs.map(toCategoryDTO);
};

export const getCategoryById = async (id: string): Promise<Category> => {
  let doc: any = null;
  if (mongoose.isValidObjectId(id)) {
    doc = await CategoryModel.findById(id);
  }
  if (!doc) {
    doc = await CategoryModel.findOne({ slug: id });
  }

  if (!doc) {
    throw new AppError('Category not found.', 404);
  }
  return toCategoryDTO(doc);
};

export const createCategory = async (data: {
  name: string;
  description?: string;
  icon?: string;
}): Promise<Category> => {
  if (!data.name || !data.name.trim()) {
    throw new AppError('Category name is required.', 400);
  }

  const name = data.name.trim();
  const slug = slugify(name);

  const existing = await CategoryModel.findOne({ slug });
  if (existing) {
    throw new AppError('A category with this name already exists.', 409);
  }

  const doc = await CategoryModel.create({
    name,
    slug,
    description: (data.description || '').trim(),
    icon: data.icon?.trim() || 'folder-outline'
  });

  return toCategoryDTO(doc);
};

export const updateCategory = async (
  id: string,
  data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Category> => {
  let doc: any = null;
  if (mongoose.isValidObjectId(id)) {
    doc = await CategoryModel.findById(id);
  }
  if (!doc) {
    doc = await CategoryModel.findOne({ slug: id });
  }

  if (!doc) {
    throw new AppError('Category not found.', 404);
  }

  if (data.name !== undefined && data.name.trim()) {
    const nextName = data.name.trim();
    const nextSlug = slugify(nextName);

    const duplicate = await CategoryModel.findOne({
      _id: { $ne: doc._id },
      slug: nextSlug
    });
    if (duplicate) {
      throw new AppError('A category with this name already exists.', 409);
    }
    doc.name = nextName;
    doc.slug = nextSlug;
  }

  if (data.description !== undefined) {
    doc.description = data.description.trim();
  }
  if (data.icon !== undefined) {
    doc.icon = data.icon.trim();
  }

  await doc.save();
  return toCategoryDTO(doc);
};

export const deleteCategory = async (id: string): Promise<Category> => {
  let doc: any = null;
  if (mongoose.isValidObjectId(id)) {
    doc = await CategoryModel.findById(id);
  }
  if (!doc) {
    doc = await CategoryModel.findOne({ slug: id });
  }

  if (!doc) {
    throw new AppError('Category not found.', 404);
  }

  await CategoryModel.findByIdAndDelete(doc._id);
  return toCategoryDTO(doc);
};
