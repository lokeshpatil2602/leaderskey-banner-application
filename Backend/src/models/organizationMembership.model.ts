import { Schema, model, Document } from 'mongoose';
import { IOrganization } from './organization.model';

export interface IOrganizationMembership extends Document {
  userId: Schema.Types.ObjectId; // reference to User
  organizationId: Schema.Types.ObjectId; // reference to Organization
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'removed';
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationMembershipSchema = new Schema<IOrganizationMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    status: { type: String, enum: ['active', 'pending', 'removed'], default: 'active' },
  },
  { timestamps: true }
);

export const OrganizationMembership = model<IOrganizationMembership>('OrganizationMembership', OrganizationMembershipSchema);
