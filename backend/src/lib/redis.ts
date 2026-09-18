import { Redis } from 'ioredis';
import { config } from '../config/env';

export const redisConnection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: config.REDIS_URL.startsWith('rediss://')
    ? { rejectUnauthorized: false }
    : undefined,
});

redisConnection.on('error', (err) => {
  console.warn('[Redis] Connection warning:', err.message);
});

redisConnection.on('connect', () => {
  console.log('[Redis] Connected to Upstash Redis successfully');
});
