import { Request, Response, NextFunction } from 'express';
import { OrganizationMembership } from '../models/organizationMembership.model';
import { Organization } from '../models/organization.model';

/**
 * Middleware to attach the organization (and membership) to the request based on the authenticated user.
 * Assumes `requireAuth` has already populated `req.user` with the user's `_id`.
 * If the user belongs to multiple organizations, the first active membership is attached.
 */
export const attachOrganization = async (req: Request & any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find an active membership for the user
    const membership = await OrganizationMembership.findOne({
      userId,
      status: 'active',
    }).populate('organizationId');

    if (!membership) {
      return res.status(403).json({ message: 'User does not belong to any organization' });
    }

    // Attach to request
    req.membership = membership;
    req.organization = (membership as any).organizationId as typeof Organization;
    next();
  } catch (err) {
    next(err);
  }
};
