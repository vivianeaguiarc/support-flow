import type { UserRole } from '../types/user-role.js';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
  /** Effective tenant for data access (super admin override via header/subdomain). */
  scopedTenantId?: string;
};
