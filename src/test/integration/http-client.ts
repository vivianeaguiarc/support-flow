import type { UserRole } from '@prisma/client';
import type { Express } from 'express';
import request from 'supertest';

import { signToken } from '../../shared/security/jwt.js';

export async function login(
  app: Express,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  return response.body.token as string;
}

export function createAuthToken(input: {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
}): string {
  return signToken(input);
}

export function authRequest(app: Express, token: string) {
  return {
    get: (url: string) =>
      request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) =>
      request(app).post(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) =>
      request(app).patch(url).set('Authorization', `Bearer ${token}`),
  };
}
