import { Redis } from 'ioredis';

import { env } from '../../../config/env.js';

const MEMORY_TTL_MS = 60_000;
const REDIS_TTL_SECONDS = 60;
const REDIS_KEY_PREFIX = 'feature-flag:';

type MemoryEntry = {
  value: boolean;
  expiresAt: number;
};

export class FeatureFlagCache {
  private readonly memory = new Map<string, MemoryEntry>();
  private redis: Redis | null = null;
  private redisReady = false;

  constructor() {
    if (env.QUEUE_ENABLED) {
      this.redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
    }
  }

  async get(key: string): Promise<boolean | undefined> {
    const memoryValue = this.getFromMemory(key);
    if (memoryValue !== undefined) {
      return memoryValue;
    }

    const redisValue = await this.getFromRedis(key);
    if (redisValue !== undefined) {
      this.setInMemory(key, redisValue);
      return redisValue;
    }

    return undefined;
  }

  async set(key: string, value: boolean): Promise<void> {
    this.setInMemory(key, value);
    await this.setInRedis(key, value);
  }

  async invalidate(key: string): Promise<void> {
    this.memory.delete(key);

    if (!this.redis) {
      return;
    }

    try {
      await this.ensureRedis();
      await this.redis.del(`${REDIS_KEY_PREFIX}${key}`);
    } catch {
      // Cache invalidation failures must not block flag management.
    }
  }

  clearForTests(): void {
    this.memory.clear();
  }

  private getFromMemory(key: string): boolean | undefined {
    const entry = this.memory.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return undefined;
    }

    return entry.value;
  }

  private setInMemory(key: string, value: boolean): void {
    this.memory.set(key, {
      value,
      expiresAt: Date.now() + MEMORY_TTL_MS,
    });
  }

  private async getFromRedis(key: string): Promise<boolean | undefined> {
    if (!this.redis) {
      return undefined;
    }

    try {
      await this.ensureRedis();
      const raw = await this.redis.get(`${REDIS_KEY_PREFIX}${key}`);

      if (raw === null) {
        return undefined;
      }

      return raw === '1';
    } catch {
      return undefined;
    }
  }

  private async setInRedis(key: string, value: boolean): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      await this.ensureRedis();
      await this.redis.set(
        `${REDIS_KEY_PREFIX}${key}`,
        value ? '1' : '0',
        'EX',
        REDIS_TTL_SECONDS,
      );
    } catch {
      // Redis cache is best-effort; in-memory cache remains available.
    }
  }

  private async ensureRedis(): Promise<void> {
    if (!this.redis || this.redisReady) {
      return;
    }

    await this.redis.connect();
    this.redisReady = true;
  }
}

export const featureFlagCache = new FeatureFlagCache();
