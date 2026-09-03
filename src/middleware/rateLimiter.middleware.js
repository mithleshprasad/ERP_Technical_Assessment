const redis = require('../config/redis');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const WINDOW_SEC = Number(process.env.RATE_LIMIT_WINDOW_SEC) || 60;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

/**
 * Fixed-window counter in Redis: `ratelimit:{identifier}:{windowStart}`.
 * INCR is atomic, so concurrent requests in the same window never under-count.
 * The key is only given a TTL on its first increment, so it self-expires
 * and never needs manual cleanup.
 */
async function rateLimiter(req, res, next) {
  const identifier = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  const windowStart = Math.floor(Date.now() / 1000 / WINDOW_SEC);
  const key = `ratelimit:${identifier}:${windowStart}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SEC);
    }

    res.set('X-RateLimit-Limit', String(MAX_REQUESTS));
    res.set('X-RateLimit-Remaining', String(Math.max(MAX_REQUESTS - count, 0)));

    if (count > MAX_REQUESTS) {
      throw ApiError.tooManyRequests(`Rate limit exceeded: ${MAX_REQUESTS} requests per ${WINDOW_SEC}s`);
    }
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    // Redis unavailable: fail-open so the API stays usable, degraded but not down.
    logger.warn(`Rate limiter bypassed, Redis error: ${err.message}`);
    next();
  }
}

module.exports = rateLimiter;
