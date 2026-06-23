export const SENSITIVE_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.refreshToken',
  'req.body.token',
  'req.body.accessToken',
  'password',
  'refreshToken',
  'accessToken',
  'token',
  'authorization',
  'cookie',
] as const;

const SENSITIVE_KEYS = new Set(
  [
    'password',
    'refreshtoken',
    'accesstoken',
    'token',
    'authorization',
    'cookie',
  ].map((key) => key.toLowerCase()),
);

export function sanitizeLogData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeLogData(value as Record<string, unknown>);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}
