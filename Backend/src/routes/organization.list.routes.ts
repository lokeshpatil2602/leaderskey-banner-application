import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { OrganizationMembership } from '../models/organizationMembership.model';
import { Organization } from '../models/organization.model';
import { requireAuth } from '../middleware/auth.middleware';

/**
 * GET /api/organizations
 * Returns all organizations the authenticated user is a member of.
 * No specific organization context required – we just query memberships.
 */
const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request & any, res: Response) => {
    const userId = req.user._id;
    // Find all active memberships for this user and populate the organization data
    const memberships = await OrganizationMembership.find({
      userId,
      status: 'active',
    }).populate('organizationId');

    const organizations = memberships
      .filter((m) => Boolean((m as any).organizationId))
      .map((m) => {
        const org = (m as any).organizationId;
        return {
          _id: org._id,
          name: org.name,
          slug: org.slug,
          logo: org.logo,
          description: org.description,
          status: org.status,
          plan: org.plan,
          ownerId: org.ownerId,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
          role: m.role,
        };
      });

    sendSuccess(res, 'User organizations loaded', organizations);
  })
);

export default router;
