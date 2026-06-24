import { describe, expect, it } from 'vitest';

import { UserRole } from '../types/user-role.js';
import {
  hasAnyPermission,
  LEGACY_ROLE_PERMISSIONS,
  PermissionKey,
} from './permissions.js';

describe('permissions', () => {
  it('maps admin legacy role to users.manage', () => {
    expect(LEGACY_ROLE_PERMISSIONS[UserRole.ADMIN]).toContain(
      PermissionKey.USERS_MANAGE,
    );
  });

  it('grants all permissions to super admin', () => {
    expect(LEGACY_ROLE_PERMISSIONS[UserRole.SUPER_ADMIN]).toContain(
      PermissionKey.FEATURE_FLAGS_MANAGE,
    );
  });

  it('checks permission membership', () => {
    const permissions = new Set([PermissionKey.TICKETS_READ]);
    expect(hasAnyPermission(permissions, [PermissionKey.TICKETS_READ])).toBe(
      true,
    );
    expect(hasAnyPermission(permissions, [PermissionKey.USERS_MANAGE])).toBe(
      false,
    );
  });
});
