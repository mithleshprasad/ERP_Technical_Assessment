const redis = require('../config/redis');
const logger = require('../utils/logger');

const PRODUCT_LIST_TTL_SEC = 60;
const INVENTORY_TTL_SEC = 30;

const productListKey = (page, limit, search) => `products:list:page:${page}:limit:${limit}:search:${search || ''}`;
const inventoryKey = (productId) => `inventory:product:${productId}`;

async function safeGet(key) {
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.warn(`Cache GET failed for ${key}: ${err.message}`);
    return null; // Cache miss on error: caller falls back to the database.
  }
}

async function safeSet(key, value, ttlSec) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
  } catch (err) {
    logger.warn(`Cache SET failed for ${key}: ${err.message}`);
  }
}

async function safeDel(keyOrPattern) {
  try {
    if (keyOrPattern.includes('*')) {
      const stream = redis.scanStream({ match: keyOrPattern, count: 100 });
      const keys = [];
      for await (const found of stream) keys.push(...found);
      if (keys.length) await redis.del(keys);
    } else {
      await redis.del(keyOrPattern);
    }
  } catch (err) {
    logger.warn(`Cache DEL failed for ${keyOrPattern}: ${err.message}`);
  }
}

module.exports = {
  PRODUCT_LIST_TTL_SEC,
  INVENTORY_TTL_SEC,
  productListKey,
  inventoryKey,
  getProductList: (page, limit, search) => safeGet(productListKey(page, limit, search)),
  setProductList: (page, limit, search, data) => safeSet(productListKey(page, limit, search), data, PRODUCT_LIST_TTL_SEC),
  invalidateProductLists: () => safeDel('products:list:*'),
  getInventory: (productId) => safeGet(inventoryKey(productId)),
  setInventory: (productId, data) => safeSet(inventoryKey(productId), data, INVENTORY_TTL_SEC),
  invalidateInventory: (productId) => safeDel(inventoryKey(productId)),
};
