import type { User } from '@prisma/client';

export type PublicUser = Omit<User, 'password'>;

export function toPublicUser(user: User): PublicUser {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}
