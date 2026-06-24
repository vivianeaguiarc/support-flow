import { describe, expect, it } from 'vitest';

import { AuditAction, AuditEntity } from './audit-actions.js';
import {
  type AuditHashInput,
  computeAuditHash,
  GENESIS_PREVIOUS_HASH,
  stableStringify,
} from './audit-hash.js';

const baseInput: AuditHashInput = {
  organizationId: 'org-1',
  userId: 'user-1',
  action: AuditAction.TICKET_CREATED,
  entity: AuditEntity.TICKET,
  entityId: 'ticket-1',
  oldValues: null,
  newValues: { status: 'OPEN' },
  metadata: { ip: '127.0.0.1' },
  createdAt: new Date('2026-06-25T10:00:00.000Z'),
  previousHash: null,
};

describe('computeAuditHash', () => {
  it('produces a deterministic sha256 hex digest', () => {
    const hash = computeAuditHash(baseInput);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(computeAuditHash(baseInput)).toBe(hash);
  });

  it('is independent of object key ordering in JSON fields', () => {
    const reordered: AuditHashInput = {
      ...baseInput,
      metadata: { ip: '127.0.0.1' },
      newValues: { status: 'OPEN' },
    };

    const shuffled: AuditHashInput = {
      ...baseInput,
      newValues: { status: 'OPEN' },
      metadata: { ip: '127.0.0.1' },
    };

    expect(computeAuditHash(reordered)).toBe(computeAuditHash(shuffled));
  });

  it('treats undefined and null JSON fields identically', () => {
    const withUndefined = computeAuditHash({
      ...baseInput,
      oldValues: undefined,
      metadata: undefined,
    });
    const withNull = computeAuditHash({
      ...baseInput,
      oldValues: null,
      metadata: null,
    });

    expect(withUndefined).toBe(withNull);
  });

  it('changes when any meaningful field changes', () => {
    const original = computeAuditHash(baseInput);

    expect(computeAuditHash({ ...baseInput, action: 'tampered' })).not.toBe(
      original,
    );
    expect(computeAuditHash({ ...baseInput, entityId: 'ticket-2' })).not.toBe(
      original,
    );
    expect(
      computeAuditHash({ ...baseInput, newValues: { status: 'CLOSED' } }),
    ).not.toBe(original);
  });

  it('chains records: the same content yields a different hash per previousHash', () => {
    const first = computeAuditHash(baseInput);
    const second = computeAuditHash({ ...baseInput, previousHash: first });
    const tampered = computeAuditHash({
      ...baseInput,
      previousHash: 'forged-hash',
    });

    expect(second).not.toBe(first);
    expect(second).not.toBe(tampered);
  });

  it('uses the genesis sentinel for the first record', () => {
    const withNull = computeAuditHash({ ...baseInput, previousHash: null });
    const withGenesis = computeAuditHash({
      ...baseInput,
      previousHash: GENESIS_PREVIOUS_HASH,
    });

    expect(withNull).toBe(withGenesis);
  });
});

describe('stableStringify', () => {
  it('sorts keys recursively', () => {
    const result = stableStringify({ b: 1, a: { d: 2, c: 3 } });
    expect(result).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it('normalizes undefined to null', () => {
    expect(stableStringify(undefined)).toBe('null');
    expect(stableStringify({ a: undefined })).toBe('{"a":null}');
  });
});
