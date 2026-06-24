import type { Express } from 'express';
import request from 'supertest';

import type { ApiSuccessResponse } from '../../shared/http/response/api-response.js';
import { signToken } from '../../shared/security/jwt.js';
import type { UserRole } from '../../shared/types/user-role.js';

export function unwrapApiData<T>(body: ApiSuccessResponse<T>): T {
  return body.data;
}

export function getApiErrorMessage(body: {
  error: { message: string };
}): string {
  return body.error.message;
}

export async function login(
  app: Express,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  return unwrapApiData(response.body).accessToken;
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

  return unwrapApiData(response.body);
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

export function apiKeyRequest(app: Express, apiKey: string) {
  return {
    get: (url: string) => request(app).get(url).set('x-api-key', apiKey),
    post: (url: string) => request(app).post(url).set('x-api-key', apiKey),
  };
}
