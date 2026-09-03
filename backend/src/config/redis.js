const Redis = require('ioredis');
const logger = require('../utils/logger');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: 1,
  // Without this, ioredis queues commands issued while disconnected and only
  // fails them after working through the reconnect backoff below - turning
  // "Redis is down" into multi-second latency on every request instead of an
  // immediate cache-miss. Disabling the offline queue makes a command fail
  // (and cache.service.js/rateLimiter fall back to the DB) as soon as the
  // connection isn't ready, while reconnection keeps retrying in the background.
  enableOfflineQueue: false,
  connectTimeout: 2000,
  retryStrategy(times) {
    return Math.min(times * 200, 2000);
  },
  lazyConnect: false,
});

redis.on('connect', () => logger.info('Redis connection established'));
redis.on('error', (err) => logger.warn(`Redis error: ${err.code || err.message || err}`));

module.exports = redis;
