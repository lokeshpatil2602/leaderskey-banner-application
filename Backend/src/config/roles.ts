export const USER_ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_ROLE: UserRole = 'USER';

export const ROLE_PERMISSIONS = {
  USER: ['USER'],
  ADMIN: ['USER', 'ADMIN'],
  SUPER_ADMIN: ['USER', 'ADMIN', 'SUPER_ADMIN']
} as const;

export const isValidRole = (role: string): role is UserRole => USER_ROLES.includes(role as UserRole);
