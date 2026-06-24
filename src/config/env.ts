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
    TICKET_CREATE_RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(900_000),
    TICKET_CREATE_RATE_LIMIT_MAX_REQUESTS: z.coerce
      .number()
      .int()
      .positive()
      .default(30),
    ATTACHMENT_UPLOAD_RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(900_000),
    ATTACHMENT_UPLOAD_RATE_LIMIT_MAX_REQUESTS: z.coerce
      .number()
      .int()
      .positive()
      .default(20),
    API_KEY_RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(900_000),
    API_KEY_RATE_LIMIT_MAX_REQUESTS: z.coerce
      .number()
      .int()
      .positive()
      .default(10),
    WEBHOOK_RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(900_000),
    WEBHOOK_RATE_LIMIT_MAX_REQUESTS: z.coerce
      .number()
      .int()
      .positive()
      .default(15),
    LOGIN_MAX_FAILED_ATTEMPTS: z.coerce.number().int().positive().default(5),
    LOGIN_LOCK_DURATION_MS: z.coerce.number().int().positive().default(900_000),
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
    EMAIL_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => parseOptionalBoolean(value, false)),
    EMAIL_PROVIDER: z
      .enum(['smtp', 'sendgrid', 'resend', 'aws-ses', 'noop'])
      .default('smtp'),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => parseOptionalBoolean(value, false)),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().email().optional(),
    QUEUE_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => parseOptionalBoolean(value, false)),
    QUEUE_WORKERS_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => parseOptionalBoolean(value, true)),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    QUEUE_DEFAULT_ATTEMPTS: z.coerce.number().int().positive().default(5),
    QUEUE_BACKOFF_DELAY_MS: z.coerce.number().int().positive().default(1000),
    QUEUE_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
    QUEUE_JOB_TIMEOUT_MS: z.coerce.number().int().positive().default(300_000),
    OTEL_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => parseOptionalBoolean(value, false)),
    OTEL_SERVICE_NAME: z.string().min(1).default('supportflow-backend'),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    METRICS_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => parseOptionalBoolean(value, true)),
    TENANT_BASE_DOMAIN: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') {
      return;
    }

    if (data.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be at least 32 characters in production',
      });
    }

    if (data.JWT_REFRESH_SECRET.length < 32) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_REFRESH_SECRET'],
        message:
          'JWT_REFRESH_SECRET must be at least 32 characters in production',
      });
    }

    const databaseHost = data.DATABASE_URL.toLowerCase();
    if (
      databaseHost.includes('localhost') ||
      databaseHost.includes('127.0.0.1')
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message:
          'DATABASE_URL must not point to localhost in production — use a managed PostgreSQL instance',
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
  swaggerEnabled: parsed.SWAGGER_ENABLED ?? true,
};

export type Env = typeof env;
