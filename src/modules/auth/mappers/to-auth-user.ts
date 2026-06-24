import type { UserRole } from '../../../shared/types/user-role.js';
import type { User } from '../../users/domain/user.entity.js';

/**
 * Public representation of the authenticated user returned by `GET /auth/me`.
 * Deliberately excludes every sensitive/internal field (`password`,
 * `failedLoginAttempts`, `lockedUntil`).
 */
export type AuthUserResponse = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
};

export function toAuthUser(user: User): AuthUserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
