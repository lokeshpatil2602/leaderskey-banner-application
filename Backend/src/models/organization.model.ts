import { Schema, model, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  status: 'active' | 'inactive' | 'pending';
  plan: 'free' | 'pro' | 'enterprise';
  ownerId: Schema.Types.ObjectId; // reference to User
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logo: { type: String },
    description: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Organization = model<IOrganization>('Organization', OrganizationSchema);
