import { createHash } from 'node:crypto';

/**
 * Sentinel previous-hash used for the very first record of the chain (genesis).
 * Keeping an explicit constant avoids ambiguity between "no previous record"
 * and a record whose previous hash happens to be empty.
 */
export const GENESIS_PREVIOUS_HASH = 'GENESIS';

/**
 * The subset of audit-log fields that participate in the hash computation.
 * `sequence`, `id` and `hash` itself are intentionally excluded: the hash binds
 * the meaningful content of the record plus the link to the previous record.
 */
export type AuditHashInput = {
  organizationId: string | null;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValues: unknown;
  newValues: unknown;
  metadata: unknown;
  createdAt: Date;
  previousHash: string | null;
};

/**
 * Deterministically serializes any JSON-compatible value with object keys sorted
 * recursively. `undefined` is normalized to `null` so that an in-memory record
 * (where an optional field is `undefined`) hashes identically to the same record
 * read back from the database (where the column is `null`).
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeForHash(value));
}

function normalizeForHash(value: unknown): unknown {
  if (value === undefined || value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeForHash(item));
  }

  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const sortedKeys = Object.keys(source).sort();
    const normalized: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      normalized[key] = normalizeForHash(source[key]);
    }
    return normalized;
  }

  return value;
}

/**
 * Computes the SHA-256 hash of a record, chaining it to the previous record.
 * The previous hash is folded into the canonical payload so any attempt to
 * reorder, insert or tamper with a record breaks every subsequent hash.
 */
export function computeAuditHash(input: AuditHashInput): string {
  const canonical = stableStringify({
    organizationId: input.organizationId ?? null,
    userId: input.userId ?? null,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    oldValues: input.oldValues,
    newValues: input.newValues,
    metadata: input.metadata,
    createdAt: input.createdAt.toISOString(),
    previousHash: input.previousHash ?? GENESIS_PREVIOUS_HASH,
  });

  return createHash('sha256').update(canonical).digest('hex');
}
