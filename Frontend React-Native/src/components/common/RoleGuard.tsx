import React from 'react';
import { AuthUser, AuthUserRole } from '../../api/services/authService';
import { AccessDeniedScreen } from '../../screens/app/AccessDeniedScreen';

type RoleGuardProps = {
  user: AuthUser;
  allowedRoles: AuthUserRole[];
  children: React.ReactNode;
  onNavigateHome?: () => void;
};

export function RoleGuard({ user, allowedRoles, children, onNavigateHome }: RoleGuardProps) {
  const isAllowed = allowedRoles.includes(user.role);

  if (!isAllowed) {
    return <AccessDeniedScreen userRole={user.role} onNavigateHome={onNavigateHome} />;
  }

  return <>{children}</>;
}
