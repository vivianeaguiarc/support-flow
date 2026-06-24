import { UserRole } from '../../../shared/types/user-role.js';

export const ASSIGNEE_TEAM_ROLES = [
  UserRole.AGENT,
  UserRole.SUPERVISOR,
  UserRole.ADMIN,
] as const;

export type AssigneeTeamRole = (typeof ASSIGNEE_TEAM_ROLES)[number];
