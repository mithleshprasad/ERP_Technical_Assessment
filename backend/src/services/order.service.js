const { Op } = require('sequelize');
const { sequelize, Product, Order, OrderItem, InventoryTransaction, JournalEntry, JournalEntryLine } = require('../models');
const ApiError = require('../utils/ApiError');
const inventoryService = require('./inventory.service');
const accountingService = require('./accounting.service');
const cache = require('./cache.service');
const { emitInventoryUpdated } = require('./socket.service');

function mergeDuplicateItems(items) {
  const byProduct = new Map();
  for (const item of items) {
    byProduct.set(item.productId, (byProduct.get(item.productId) || 0) + item.quantity);
  }
  return Array.from(byProduct.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

/**
 * Full order flow, one DB transaction:
 *   validate products -> create PENDING order -> atomically deduct stock
 *   per item -> record OUT inventory transactions -> create order items
 *   -> create balanced journal entry -> mark order COMPLETED -> commit.
 *
 * Any failure (insufficient stock, missing product, accounting error)
 * throws inside the transaction callback, and Sequelize rolls back
 * everything created so far in this call - the order row, the stock
 * deduction, and any order items/journal rows. Nothing is committed
 * until every step succeeds, so the system can never be left with an
 * order that has no matching inventory movement or accounting entry.
 *
 * Cache invalidation and the WebSocket broadcast happen only after the
 * transaction has committed, so clients are never notified of a stock
 * change that ends up rolled back.
 */
async function createOrder({ customerId, items }, userId) {
  const mergedItems = mergeDuplicateItems(items);
  const warehouseId = await inventoryService.resolveWarehouseId(undefined);

  const order = await sequelize.transaction(async (transaction) => {
    const productIds = mergedItems.map((i) => i.productId);
    const products = await Product.findAll({ where: { id: { [Op.in]: productIds } }, transaction });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of mergedItems) {
      const product = productMap.get(item.productId);
      if (!product) throw ApiError.badRequest(`Product ${item.productId} does not exist`);
      if (!product.isActive) throw ApiError.badRequest(`Product ${product.name} is not active`);
    }

    const totalAmount = mergedItems.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const newOrder = await Order.create(
      { customerId, status: 'PENDING', totalAmount, createdBy: userId || null },
      { transaction }
    );

    for (const item of mergedItems) {
      const deducted = await inventoryService.atomicDeductStock({
        productId: item.productId,
        warehouseId,
        quantity: item.quantity,
        transaction,
      });
      if (!deducted) {
        const product = productMap.get(item.productId);
        throw ApiError.conflict(`Insufficient stock for product '${product.name}' (requested ${item.quantity})`);
      }

      const product = productMap.get(item.productId);
      await OrderItem.create(
        {
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal: Number(product.price) * item.quantity,
        },
        { transaction }
      );

      await InventoryTransaction.create(
        {
          productId: item.productId,
          warehouseId,
          type: 'OUT',
          quantity: item.quantity,
          referenceId: newOrder.id,
          note: 'Sales order deduction',
        },
        { transaction }
      );
    }

    await accountingService.createSalesJournalEntry({ orderId: newOrder.id, amount: totalAmount, transaction });

    await newOrder.update({ status: 'COMPLETED' }, { transaction });
    return newOrder;
  });

  await Promise.all(
    mergedItems.map(async (item) => {
      await cache.invalidateInventory(item.productId);
      const availableQuantity = await inventoryService.totalAvailable(item.productId);
      emitInventoryUpdated({ productId: item.productId, availableQuantity });
    })
  );

  return getOrderById(order.id);
}

async function getOrderById(id) {
  const order = await Order.findByPk(id, {
    include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }] }],
  });
  if (!order) throw ApiError.notFound('Order not found');

  // JournalEntry.referenceId is a loose reference (the spec's field, not a
  // formal FK) rather than a Sequelize association, so it's looked up
  // separately instead of via `include`.
  const journalEntry = await JournalEntry.findOne({
    where: { referenceId: id },
    include: [{ model: JournalEntryLine, as: 'lines' }],
  });

  return { ...order.toJSON(), journalEntry };
}

async function listOrders({ page, limit, status, customerId, startDate, endDate }) {
  const where = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = new Date(startDate);
    if (endDate) where.createdAt[Op.lte] = new Date(endDate);
  }

  const { rows, count } = await Order.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
    include: [{ model: OrderItem, as: 'items', attributes: ['id', 'productId', 'quantity', 'unitPrice', 'subtotal'] }],
    distinct: true, // required for a correct COUNT alongside the items include
  });

  return { data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
}

module.exports = { createOrder, getOrderById, listOrders };
