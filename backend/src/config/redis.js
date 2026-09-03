const Redis = require('ioredis');
const logger = require('../utils/logger');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    return Math.min(times * 200, 2000);
  },
  lazyConnect: false,
});

redis.on('connect', () => logger.info('Redis connection established'));
redis.on('error', (err) => logger.warn(`Redis error: ${err.code || err.message || err}`));

module.exports = redis;
