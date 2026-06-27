import { UserRole } from '../types/user-role.js';

export const PermissionKey = {
  TICKETS_CREATE: 'tickets.create',
  TICKETS_READ: 'tickets.read',
  TICKETS_UPDATE: 'tickets.update',
  TICKETS_DELETE: 'tickets.delete',
  TICKETS_ASSIGN: 'tickets.assign',
  TICKETS_CLOSE: 'tickets.close',
  KNOWLEDGE_CREATE: 'knowledge.create',
  KNOWLEDGE_PUBLISH: 'knowledge.publish',
  AUTOMATION_MANAGE: 'automation.manage',
  WEBHOOKS_MANAGE: 'webhooks.manage',
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',
  ANALYTICS_READ: 'analytics.read',
  REPORTS_EXPORT: 'reports.export',
  API_KEYS_MANAGE: 'apiKeys.manage',
  FEATURE_FLAGS_MANAGE: 'featureFlags.manage',
  AUDIT_READ: 'audit.read',
  SLA_POLICIES_READ: 'slaPolicies.read',
  SLA_POLICIES_CREATE: 'slaPolicies.create',
  SLA_POLICIES_UPDATE: 'slaPolicies.update',
  SLA_POLICIES_DELETE: 'slaPolicies.delete',
} as const;

export type PermissionKeyValue =
  (typeof PermissionKey)[keyof typeof PermissionKey];

export const ALL_PERMISSION_KEYS = Object.values(PermissionKey);

export const INITIAL_PERMISSIONS: Array<{
  key: PermissionKeyValue;
  description: string;
}> = [
  { key: PermissionKey.TICKETS_CREATE, description: 'Create tickets' },
  { key: PermissionKey.TICKETS_READ, description: 'Read tickets' },
  { key: PermissionKey.TICKETS_UPDATE, description: 'Update tickets' },
  { key: PermissionKey.TICKETS_DELETE, description: 'Delete tickets' },
  { key: PermissionKey.TICKETS_ASSIGN, description: 'Assign tickets' },
  { key: PermissionKey.TICKETS_CLOSE, description: 'Close tickets' },
  {
    key: PermissionKey.KNOWLEDGE_CREATE,
    description: 'Create knowledge articles',
  },
  {
    key: PermissionKey.KNOWLEDGE_PUBLISH,
    description: 'Publish knowledge articles',
  },
  {
    key: PermissionKey.AUTOMATION_MANAGE,
    description: 'Manage automation rules',
  },
  { key: PermissionKey.WEBHOOKS_MANAGE, description: 'Manage webhooks' },
  { key: PermissionKey.USERS_MANAGE, description: 'Manage users' },
  {
    key: PermissionKey.ROLES_MANAGE,
    description: 'Manage roles and permissions',
  },
  { key: PermissionKey.ANALYTICS_READ, description: 'Read analytics' },
  { key: PermissionKey.REPORTS_EXPORT, description: 'Export reports' },
  { key: PermissionKey.API_KEYS_MANAGE, description: 'Manage API keys' },
  {
    key: PermissionKey.FEATURE_FLAGS_MANAGE,
    description: 'Manage platform feature flags',
  },
  {
    key: PermissionKey.AUDIT_READ,
    description: 'Read immutable audit logs',
  },
  { key: PermissionKey.SLA_POLICIES_READ, description: 'Read SLA policies' },
  {
    key: PermissionKey.SLA_POLICIES_CREATE,
    description: 'Create SLA policies',
  },
  {
    key: PermissionKey.SLA_POLICIES_UPDATE,
    description: 'Update SLA policies',
  },
  {
    key: PermissionKey.SLA_POLICIES_DELETE,
    description: 'Delete SLA policies',
  },
];

const ADMIN_PERMISSIONS: PermissionKeyValue[] = [
  PermissionKey.TICKETS_CREATE,
  PermissionKey.TICKETS_READ,
  PermissionKey.TICKETS_UPDATE,
  PermissionKey.TICKETS_DELETE,
  PermissionKey.TICKETS_ASSIGN,
  PermissionKey.TICKETS_CLOSE,
  PermissionKey.KNOWLEDGE_CREATE,
  PermissionKey.KNOWLEDGE_PUBLISH,
  PermissionKey.AUTOMATION_MANAGE,
  PermissionKey.WEBHOOKS_MANAGE,
  PermissionKey.USERS_MANAGE,
  PermissionKey.ROLES_MANAGE,
  PermissionKey.ANALYTICS_READ,
  PermissionKey.REPORTS_EXPORT,
  PermissionKey.API_KEYS_MANAGE,
  PermissionKey.AUDIT_READ,
  PermissionKey.SLA_POLICIES_READ,
  PermissionKey.SLA_POLICIES_CREATE,
  PermissionKey.SLA_POLICIES_UPDATE,
  PermissionKey.SLA_POLICIES_DELETE,
];

export const LEGACY_ROLE_PERMISSIONS: Record<UserRole, PermissionKeyValue[]> = {
  [UserRole.SUPER_ADMIN]: [...ALL_PERMISSION_KEYS],
  [UserRole.ADMIN]: ADMIN_PERMISSIONS,
  [UserRole.SUPERVISOR]: [
    PermissionKey.TICKETS_CREATE,
    PermissionKey.TICKETS_READ,
    PermissionKey.TICKETS_UPDATE,
    PermissionKey.TICKETS_ASSIGN,
    PermissionKey.TICKETS_CLOSE,
    PermissionKey.KNOWLEDGE_CREATE,
    PermissionKey.KNOWLEDGE_PUBLISH,
    PermissionKey.ANALYTICS_READ,
    PermissionKey.REPORTS_EXPORT,
    PermissionKey.AUDIT_READ,
    PermissionKey.SLA_POLICIES_READ,
    PermissionKey.SLA_POLICIES_UPDATE,
  ],
  [UserRole.AGENT]: [
    PermissionKey.TICKETS_CREATE,
    PermissionKey.TICKETS_READ,
    PermissionKey.TICKETS_UPDATE,
    PermissionKey.TICKETS_ASSIGN,
    PermissionKey.TICKETS_CLOSE,
    PermissionKey.SLA_POLICIES_READ,
  ],
  [UserRole.CUSTOMER]: [
    PermissionKey.TICKETS_CREATE,
    PermissionKey.TICKETS_READ,
  ],
  [UserRole.OMBUDSMAN]: [
    PermissionKey.TICKETS_READ,
    PermissionKey.TICKETS_UPDATE,
    PermissionKey.TICKETS_CLOSE,
  ],
};

export const DEFAULT_ROLE_DEFINITIONS: Array<{
  legacyRole: UserRole;
  name: string;
  description: string;
  permissions: PermissionKeyValue[];
}> = [
  {
    legacyRole: UserRole.ADMIN,
    name: 'Administrator',
    description: 'Full tenant administration',
    permissions: ADMIN_PERMISSIONS,
  },
  {
    legacyRole: UserRole.SUPERVISOR,
    name: 'Supervisor',
    description: 'Supervises agents and operational flows',
    permissions: LEGACY_ROLE_PERMISSIONS[UserRole.SUPERVISOR],
  },
  {
    legacyRole: UserRole.AGENT,
    name: 'Agent',
    description: 'Handles customer tickets',
    permissions: LEGACY_ROLE_PERMISSIONS[UserRole.AGENT],
  },
  {
    legacyRole: UserRole.CUSTOMER,
    name: 'Customer',
    description: 'Customer self-service access',
    permissions: LEGACY_ROLE_PERMISSIONS[UserRole.CUSTOMER],
  },
  {
    legacyRole: UserRole.OMBUDSMAN,
    name: 'Ombudsman',
    description: 'Handles escalated cases',
    permissions: LEGACY_ROLE_PERMISSIONS[UserRole.OMBUDSMAN],
  },
];

export function hasAnyPermission(
  userPermissions: Set<string>,
  required: PermissionKeyValue[],
): boolean {
  return required.some((permission) => userPermissions.has(permission));
}
