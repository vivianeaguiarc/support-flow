import 'dotenv/config';

import path from 'node:path';

import { z } from 'zod';

const logLevelSchema = z.enum([
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
]);

function parseOptionalBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value === 'true';
}

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_EXPIRES_IN: z.string().default('1d'),
    JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    CORS_ORIGIN: z.url().default('http://localhost:5173'),
    RATE_LIMIT_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => parseOptionalBoolean(value, true)),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
    AUTH_RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(900_000),
    AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce
      .number()
      .int()
      .positive()
      .default(20),
    UPLOAD_MAX_SIZE_MB: z.coerce.number().int().positive().max(100).default(10),
    UPLOAD_DIR: z.string().min(1).default('storage/attachments'),
    LOG_LEVEL: logLevelSchema.optional(),
    SWAGGER_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .transform((value): boolean | undefined =>
        value === undefined ? undefined : value === 'true',
      ),
    DATABASE_URL_TEST: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production' && data.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be at least 32 characters in production',
      });
    }

    if (data.NODE_ENV === 'production' && data.JWT_REFRESH_SECRET.length < 32) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_REFRESH_SECRET'],
        message:
          'JWT_REFRESH_SECRET must be at least 32 characters in production',
      });
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const formatted = result.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(
    `Invalid or missing environment variables:\n${formatted}\n\nCopy .env.example to .env and configure the required values.`,
  );
}

const parsed = result.data;

function resolveDefaultLogLevel(): z.infer<typeof logLevelSchema> {
  if (parsed.LOG_LEVEL) {
    return parsed.LOG_LEVEL;
  }

  if (parsed.NODE_ENV === 'development') {
    return 'debug';
  }

  if (parsed.NODE_ENV === 'test') {
    return 'warn';
  }

  return 'info';
}

function resolveUploadDir(uploadDir: string): string {
  return path.isAbsolute(uploadDir)
    ? uploadDir
    : path.resolve(process.cwd(), uploadDir);
}

export const env = {
  ...parsed,
  LOG_LEVEL: resolveDefaultLogLevel(),
  uploadMaxSizeBytes: parsed.UPLOAD_MAX_SIZE_MB * 1024 * 1024,
  uploadDirAbsolute: resolveUploadDir(parsed.UPLOAD_DIR),
  swaggerEnabled: parsed.SWAGGER_ENABLED ?? parsed.NODE_ENV !== 'production',
};

export type Env = typeof env;
