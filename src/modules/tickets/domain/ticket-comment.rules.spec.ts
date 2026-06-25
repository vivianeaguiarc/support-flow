import { describe, expect, it } from 'vitest';

import { AppError } from '../../../shared/errors/app-error.js';
import { UserRole } from '../../../shared/types/user-role.js';
import {
  canViewInternalComments,
  resolveCommentVisibility,
} from './ticket-comment.rules.js';
import { CommentVisibility } from './ticket-enums.js';

describe('resolveCommentVisibility', () => {
  it('forces PUBLIC visibility for customers when none is provided', () => {
    expect(resolveCommentVisibility(UserRole.CUSTOMER)).toBe(
      CommentVisibility.PUBLIC,
    );
  });

  it('allows customers to request PUBLIC visibility explicitly', () => {
    expect(
      resolveCommentVisibility(UserRole.CUSTOMER, CommentVisibility.PUBLIC),
    ).toBe(CommentVisibility.PUBLIC);
  });

  it('rejects customers trying to create INTERNAL comments', () => {
    expect(() =>
      resolveCommentVisibility(UserRole.CUSTOMER, CommentVisibility.INTERNAL),
    ).toThrow(new AppError('Customers can only create public comments', 403));
  });

  it('defaults staff comments to INTERNAL when none is provided', () => {
    expect(resolveCommentVisibility(UserRole.AGENT)).toBe(
      CommentVisibility.INTERNAL,
    );
    expect(resolveCommentVisibility(UserRole.ADMIN)).toBe(
      CommentVisibility.INTERNAL,
    );
  });

  it('honours the requested visibility for staff roles', () => {
    expect(
      resolveCommentVisibility(UserRole.AGENT, CommentVisibility.PUBLIC),
    ).toBe(CommentVisibility.PUBLIC);
    expect(
      resolveCommentVisibility(UserRole.SUPERVISOR, CommentVisibility.INTERNAL),
    ).toBe(CommentVisibility.INTERNAL);
  });
});

describe('canViewInternalComments', () => {
  it('denies internal comments for customers', () => {
    expect(canViewInternalComments(UserRole.CUSTOMER)).toBe(false);
  });

  it('allows internal comments for staff roles', () => {
    expect(canViewInternalComments(UserRole.AGENT)).toBe(true);
    expect(canViewInternalComments(UserRole.SUPERVISOR)).toBe(true);
    expect(canViewInternalComments(UserRole.ADMIN)).toBe(true);
  });
});
