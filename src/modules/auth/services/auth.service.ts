import type { User } from '@prisma/client';

import { AppError } from '../../../shared/errors/app-error.js';
import { comparePassword } from '../../../shared/security/password-hash.js';
import type { UsersRepository } from '../../users/repositories/users.repository.js';

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = {
  token: string;
};

type VerifyPasswordFn = typeof comparePassword;

export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly generateToken: (user: User) => string,
    private readonly verifyPassword: VerifyPasswordFn = comparePassword,
  ) {}

  async login(data: LoginInput): Promise<LoginResult> {
    const user = await this.usersRepository.findByEmail(data.email);

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await this.verifyPassword(
      data.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    return { token: this.generateToken(user) };
  }
}
