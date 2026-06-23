import { signToken } from '../../../shared/security/jwt.js';
import { usersRepository } from '../../users/repositories/users.repository.js';
import { AuthService } from './auth.service.js';

export const authService = new AuthService(usersRepository, (user) =>
  signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  }),
);

export type { LoginInput, LoginResult } from './auth.service.js';
export { AuthService } from './auth.service.js';
