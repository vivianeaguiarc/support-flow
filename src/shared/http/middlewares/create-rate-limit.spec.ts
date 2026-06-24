import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createRateLimit } from './create-rate-limit.js';

describe('createRateLimit', () => {
  it('returns 429 when max requests are exceeded', async () => {
    const app = express();
    app.use(
      createRateLimit({
        windowMs: 60_000,
        max: 2,
        message: 'Rate limit exceeded for test',
      }),
    );
    app.get('/limited', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    await request(app).get('/limited').expect(200);
    await request(app).get('/limited').expect(200);
    const response = await request(app).get('/limited').expect(429);

    expect(response.body).toEqual({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded for test',
    });
  });
});
