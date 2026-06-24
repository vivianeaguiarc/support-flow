import { z, type ZodType } from 'zod';

import { sanitizeText } from '../security/sanitize-text.js';

export function strictPayload<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

export function sanitizedString(
  options: {
    min?: number;
    max?: number;
    message?: string;
  } = {},
): ZodType<string> {
  const min = options.min ?? 1;
  const max = options.max ?? 10_000;
  const message = options.message ?? 'Value is required';

  return z
    .string()
    .trim()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(min, message)
        .max(max, `Value must be at most ${max} characters`),
    );
}

export function applyStrictObjectSchema(schema: ZodType): ZodType {
  if (schema instanceof z.ZodObject) {
    return schema.strict();
  }

  return schema;
}
