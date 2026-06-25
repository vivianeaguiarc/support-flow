import { AppError } from '../../../shared/errors/app-error.js';
import { UserRole } from '../../../shared/types/user-role.js';
import { CommentVisibility } from './ticket-enums.js';

/**
 * Resolves the effective visibility of a comment based on the author's role.
 *
 * - `CUSTOMER` may only create PUBLIC comments. Any attempt to create an
 *   INTERNAL comment is rejected (403).
 * - Staff roles (AGENT/SUPERVISOR/ADMIN) may pick the visibility; when omitted
 *   the comment defaults to INTERNAL to avoid accidentally exposing notes.
 */
export function resolveCommentVisibility(
  role: UserRole,
  requested?: CommentVisibility,
): CommentVisibility {
  if (role === UserRole.CUSTOMER) {
    if (requested && requested !== CommentVisibility.PUBLIC) {
      throw new AppError('Customers can only create public comments', 403);
    }

    return CommentVisibility.PUBLIC;
  }

  return requested ?? CommentVisibility.INTERNAL;
}

/**
 * Whether the given role is allowed to read internal (staff-only) comments.
 * Customers are limited to the public timeline.
 */
export function canViewInternalComments(role: UserRole): boolean {
  return role !== UserRole.CUSTOMER;
}
