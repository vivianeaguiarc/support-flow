import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  applyStrictObjectSchema,
  sanitizedString,
  strictPayload,
} from './zod-helpers.js';

describe('zod-helpers', () => {
  it('rejects unknown keys with strictPayload', () => {
    const schema = strictPayload({
      name: z.string(),
    });

    expect(() => schema.parse({ name: 'ok', extra: true })).toThrow();
  });

  it('sanitizes text fields', () => {
    const schema = z.object({
      content: sanitizedString({ min: 1, max: 100 }),
    });

    expect(schema.parse({ content: '<b>hello</b>' }).content).toBe('hello');
  });

  it('applies strict mode to object schemas', () => {
    const schema = applyStrictObjectSchema(
      z.object({
        id: z.string(),
      }),
    );

    expect(() => schema.parse({ id: '1', unknown: true })).toThrow();
  });
});
