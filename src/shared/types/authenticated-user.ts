import type { UserRole } from '../types/user-role.js';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
};
