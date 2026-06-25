import { describe, expect, it } from 'vitest';

import { listAuditLogsQuerySchema } from './list-audit-logs-query.dto.js';

describe('listAuditLogsQuerySchema', () => {
  it('applies defaults for sortBy and sortOrder', () => {
    const result = listAuditLogsQuerySchema.parse({});

    expect(result.sortBy).toBe('createdAt');
    expect(result.sortOrder).toBe('desc');
  });

  it('coerces page and limit to integers', () => {
    const result = listAuditLogsQuerySchema.parse({ page: '2', limit: '50' });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });

  it('rejects a limit above the maximum', () => {
    expect(() => listAuditLogsQuerySchema.parse({ limit: '500' })).toThrow();
  });

  it('parses ISO date strings into Date objects', () => {
    const result = listAuditLogsQuerySchema.parse({
      createdFrom: '2026-01-01T00:00:00.000Z',
      createdTo: '2026-12-31T23:59:59.999Z',
    });

    expect(result.createdFrom).toBeInstanceOf(Date);
    expect(result.createdTo).toBeInstanceOf(Date);
  });

  it('rejects invalid ISO date strings', () => {
    expect(() =>
      listAuditLogsQuerySchema.parse({ createdFrom: 'not-a-date' }),
    ).toThrow();
  });

  it('rejects sortBy values outside the allowlist', () => {
    expect(() => listAuditLogsQuerySchema.parse({ sortBy: 'hash' })).toThrow();
  });

  it('rejects invalid sortOrder values', () => {
    expect(() =>
      listAuditLogsQuerySchema.parse({ sortOrder: 'sideways' }),
    ).toThrow();
  });

  it('normalizes blank search to undefined', () => {
    const result = listAuditLogsQuerySchema.parse({ search: '   ' });

    expect(result.search).toBeUndefined();
  });

  it('trims search terms', () => {
    const result = listAuditLogsQuerySchema.parse({ search: '  role  ' });

    expect(result.search).toBe('role');
  });
});
