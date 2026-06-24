import { AppError } from '../errors/app-error.js';
import type { AuthenticatedUser } from '../types/authenticated-user.js';
import { TicketStatus } from '../types/ticket-status.js';
import { UserRole } from '../types/user-role.js';

export const ROLE_GROUPS = {
  USER_ADMIN: [UserRole.ADMIN],
  TICKET_CREATE: [
    UserRole.CUSTOMER,
    UserRole.AGENT,
    UserRole.SUPERVISOR,
    UserRole.ADMIN,
  ],
  TICKET_LIST: [
    UserRole.AGENT,
    UserRole.CUSTOMER,
    UserRole.SUPERVISOR,
    UserRole.OMBUDSMAN,
    UserRole.ADMIN,
  ],
  TICKET_READ: [
    UserRole.AGENT,
    UserRole.CUSTOMER,
    UserRole.SUPERVISOR,
    UserRole.OMBUDSMAN,
    UserRole.ADMIN,
  ],
  TICKET_MANAGE: [UserRole.AGENT, UserRole.SUPERVISOR, UserRole.ADMIN],
  TICKET_ASSIGN: [UserRole.SUPERVISOR, UserRole.ADMIN],
  TICKET_QUEUE: [UserRole.AGENT, UserRole.SUPERVISOR, UserRole.ADMIN],
  TICKET_STATUS: [UserRole.AGENT, UserRole.SUPERVISOR, UserRole.ADMIN],
  ESCALATION_FLOWS: [
    UserRole.SUPERVISOR,
    UserRole.OMBUDSMAN,
    UserRole.ADMIN,
    UserRole.AGENT,
  ],
  INTERNAL_COMMENTS: [UserRole.ADMIN, UserRole.AGENT, UserRole.SUPERVISOR],
  ATTACHMENT_MANAGE: [UserRole.AGENT, UserRole.SUPERVISOR, UserRole.ADMIN],
  ATTACHMENT_READ: [
    UserRole.AGENT,
    UserRole.CUSTOMER,
    UserRole.SUPERVISOR,
    UserRole.OMBUDSMAN,
    UserRole.ADMIN,
  ],
  METRICS: [UserRole.AGENT, UserRole.SUPERVISOR, UserRole.ADMIN],
  ANALYTICS: [UserRole.ADMIN, UserRole.SUPERVISOR],
  ROUTING: [UserRole.AGENT, UserRole.SUPERVISOR, UserRole.ADMIN],
  CUSTOMER_LIST: [UserRole.AGENT, UserRole.SUPERVISOR, UserRole.ADMIN],
  CATEGORY_LIST: [
    UserRole.AGENT,
    UserRole.CUSTOMER,
    UserRole.SUPERVISOR,
    UserRole.OMBUDSMAN,
    UserRole.ADMIN,
  ],
  KNOWLEDGE_MANAGE: [UserRole.SUPERVISOR, UserRole.ADMIN],
} as const satisfies Record<string, UserRole[]>;

export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function hasAnyRole(role: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(role);
}

export function canAccessInternalComments(role: UserRole): boolean {
  return hasAnyRole(role, [...ROLE_GROUPS.INTERNAL_COMMENTS]);
}

export function canManageTickets(
  role: UserRole,
  ticketStatus?: string,
): boolean {
  if (hasAnyRole(role, [...ROLE_GROUPS.TICKET_MANAGE])) {
    return true;
  }

  return role === UserRole.OMBUDSMAN && ticketStatus === TicketStatus.ESCALATED;
}

export function canBeAssignedTickets(role: UserRole): boolean {
  return (
    role === UserRole.AGENT ||
    role === UserRole.SUPERVISOR ||
    role === UserRole.ADMIN
  );
}

export function assertTicketAccess(
  ticket: { customerId: string; status: string },
  authUser: AuthenticatedUser,
): void {
  if (isAdmin(authUser.role) || authUser.role === UserRole.SUPERVISOR) {
    return;
  }

  if (authUser.role === UserRole.AGENT) {
    return;
  }

  if (authUser.role === UserRole.OMBUDSMAN) {
    if (ticket.status !== TicketStatus.ESCALATED) {
      throw new AppError('Forbidden', 403);
    }

    return;
  }

  if (
    authUser.role === UserRole.CUSTOMER &&
    ticket.customerId === authUser.id
  ) {
    return;
  }

  throw new AppError('Forbidden', 403);
}

export function assertCanManageTicket(
  authUser: AuthenticatedUser,
  ticket?: { status: string },
): void {
  if (!canManageTickets(authUser.role, ticket?.status)) {
    throw new AppError('Forbidden', 403);
  }
}

export function assertCanAssignTicket(authUser: AuthenticatedUser): void {
  if (!hasAnyRole(authUser.role, [...ROLE_GROUPS.TICKET_ASSIGN])) {
    throw new AppError('Forbidden', 403);
  }
}

export function assertCanAccessTicketQueues(authUser: AuthenticatedUser): void {
  if (!hasAnyRole(authUser.role, [...ROLE_GROUPS.TICKET_QUEUE])) {
    throw new AppError('Forbidden', 403);
  }
}

export function assertCanManageKnowledgeArticles(
  authUser: AuthenticatedUser,
): void {
  if (!hasAnyRole(authUser.role, [...ROLE_GROUPS.KNOWLEDGE_MANAGE])) {
    throw new AppError('Forbidden', 403);
  }
}

export function assertCanCreateTicket(
  authUser: AuthenticatedUser,
  data: { customerId: string; assignedToId?: string },
): void {
  if (
    isAdmin(authUser.role) ||
    authUser.role === UserRole.AGENT ||
    authUser.role === UserRole.SUPERVISOR
  ) {
    return;
  }

  if (authUser.role === UserRole.CUSTOMER) {
    if (data.customerId !== authUser.id) {
      throw new AppError('Forbidden', 403);
    }

    if (data.assignedToId) {
      throw new AppError('Customers cannot assign agents', 400);
    }

    return;
  }

  throw new AppError('Forbidden', 403);
}
