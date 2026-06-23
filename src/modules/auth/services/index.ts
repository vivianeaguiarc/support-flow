import { usersRepository } from '../../users/repositories/users.repository.js';
import { refreshTokensRepository } from '../repositories/refresh-tokens.repository.js';
import { AuthService } from './auth.service.js';

export const authService = new AuthService(
  usersRepository,
  refreshTokensRepository,
);

export type {
  LoginInput,
  LoginResult,
  LogoutInput,
  RefreshInput,
  TokenPair,
} from './auth.service.js';
export { AuthService } from './auth.service.js';
