import { describe, expect, it } from 'vitest';

import { swaggerV2Spec } from './swagger-v2.js';

const EXPECTED_V2_PATHS: Record<string, string[]> = {
  '/health': ['get'],
  '/tickets': ['get'],
};

describe('swaggerV2Spec', () => {
  it('should target v2 servers', () => {
    expect(swaggerV2Spec.servers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: expect.stringContaining('/api/v2'),
        }),
      ]),
    );
  });

  it('should document v2 proof-of-concept endpoints', () => {
    for (const [path, methods] of Object.entries(EXPECTED_V2_PATHS)) {
      expect(swaggerV2Spec.paths?.[path]).toBeDefined();

      for (const method of methods) {
        expect(swaggerV2Spec.paths?.[path]?.[method]).toBeDefined();
      }
    }
  });

  it('should expose BearerAuth security scheme', () => {
    expect(swaggerV2Spec.components?.securitySchemes?.BearerAuth).toMatchObject(
      {
        type: 'http',
        scheme: 'bearer',
      },
    );
  });
});
