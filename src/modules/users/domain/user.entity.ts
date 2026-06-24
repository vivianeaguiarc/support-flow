import type { UserRole } from '../../../shared/types/user-role.js';

export type User = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
