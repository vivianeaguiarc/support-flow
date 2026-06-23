import type { Express } from 'express';
import request from 'supertest';

import { signToken } from '../../shared/security/jwt.js';
import type { UserRole } from '../../shared/types/user-role.js';

export async function login(
  app: Express,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  return response.body.accessToken as string;
}

export async function loginWithTokens(
  app: Express,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    accessToken: response.body.accessToken as string,
    refreshToken: response.body.refreshToken as string,
  };
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
    del: (url: string) =>
      request(app).delete(url).set('Authorization', `Bearer ${token}`),
  };
}
