const { QueryTypes } = require('sequelize');
const { sequelize, Product, Warehouse, Inventory, InventoryTransaction } = require('../models');
const ApiError = require('../utils/ApiError');
const cache = require('./cache.service');
const { emitInventoryUpdated } = require('./socket.service');

async function resolveWarehouseId(warehouseId) {
  if (warehouseId) {
    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) throw ApiError.badRequest('Warehouse not found');
    return warehouse.id;
  }
  const defaultWarehouse = await Warehouse.findOne({ order: [['createdAt', 'ASC']] });
  if (!defaultWarehouse) throw ApiError.badRequest('No warehouse exists; create one before managing inventory');
  return defaultWarehouse.id;
}

/**
 * Atomic conditional UPDATE for stock deduction.
 *
 * `available_quantity = available_quantity - :quantity` combined with the
 * `WHERE ... AND available_quantity >= :quantity` guard makes the check and
 * the decrement a single indivisible statement. InnoDB takes an exclusive
 * row lock on the matched row for the duration of the UPDATE, so two
 * concurrent transactions deducting the same product/warehouse row are
 * serialized by the database itself: whichever UPDATE reaches MySQL first
 * wins and commits, the second is blocked until the first transaction ends,
 * then re-evaluates the WHERE clause against the now-committed value. If
 * stock is insufficient at that point, 0 rows are affected and no partial
 * decrement can ever happen - stock can never go negative and only one of
 * two racing "take the last N units" orders can succeed.
 *
 * Must be called inside the same DB transaction as the rest of the order
 * (order + order items + accounting entry) so a later failure rolls this
 * decrement back too.
 */
async function atomicDeductStock({ productId, warehouseId, quantity, transaction }) {
  const [, metadata] = await sequelize.query(
    `UPDATE inventories
     SET available_quantity = available_quantity - :quantity, updated_at = NOW()
     WHERE product_id = :productId AND warehouse_id = :warehouseId AND available_quantity >= :quantity`,
    { replacements: { productId, warehouseId, quantity }, transaction }
  );
  const affectedRows = typeof metadata === 'number' ? metadata : metadata?.affectedRows ?? 0;
  return affectedRows > 0;
}

async function addStock({ productId, warehouseId, quantity, note }) {
  const product = await Product.findByPk(productId);
  if (!product) throw ApiError.badRequest('Product not found');
  const resolvedWarehouseId = await resolveWarehouseId(warehouseId);

  const result = await sequelize.transaction(async (transaction) => {
    let inventory = await Inventory.findOne({
      where: { productId, warehouseId: resolvedWarehouseId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!inventory) {
      inventory = await Inventory.create(
        { productId, warehouseId: resolvedWarehouseId, availableQuantity: 0, reservedQuantity: 0 },
        { transaction }
      );
    }

    await inventory.increment('availableQuantity', { by: quantity, transaction });

    await InventoryTransaction.create(
      { productId, warehouseId: resolvedWarehouseId, type: 'IN', quantity, referenceId: 'MANUAL_ADD', note: note || null },
      { transaction }
    );

    await inventory.reload({ transaction });
    return inventory;
  });

  await cache.invalidateInventory(productId);
  emitInventoryUpdated({ productId, availableQuantity: await totalAvailable(productId) });
  return result;
}

async function adjustStock({ productId, warehouseId, quantityDelta, note }) {
  const product = await Product.findByPk(productId);
  if (!product) throw ApiError.badRequest('Product not found');
  const resolvedWarehouseId = await resolveWarehouseId(warehouseId);

  await sequelize.transaction(async (transaction) => {
    const [, metadata] = await sequelize.query(
      `UPDATE inventories
       SET available_quantity = available_quantity + :delta, updated_at = NOW()
       WHERE product_id = :productId AND warehouse_id = :warehouseId
         AND (available_quantity + :delta) >= 0`,
      { replacements: { productId, warehouseId: resolvedWarehouseId, delta: quantityDelta }, transaction }
    );
    const affectedRows = typeof metadata === 'number' ? metadata : metadata?.affectedRows ?? 0;
    if (affectedRows === 0) {
      throw ApiError.conflict('Adjustment would result in negative stock, or inventory row does not exist');
    }

    await InventoryTransaction.create(
      { productId, warehouseId: resolvedWarehouseId, type: 'ADJUSTMENT', quantity: quantityDelta, referenceId: 'MANUAL_ADJUSTMENT', note: note || null },
      { transaction }
    );
  });

  await cache.invalidateInventory(productId);
  emitInventoryUpdated({ productId, availableQuantity: await totalAvailable(productId) });
  return getInventoryByProduct(productId);
}

async function totalAvailable(productId) {
  const rows = await Inventory.findAll({ where: { productId } });
  return rows.reduce((sum, row) => sum + row.availableQuantity, 0);
}

async function getInventoryByProduct(productId) {
  const cached = await cache.getInventory(productId);
  if (cached) return { ...cached, fromCache: true };

  const product = await Product.findByPk(productId);
  if (!product) throw ApiError.notFound('Product not found');

  const rows = await Inventory.findAll({
    where: { productId },
    include: [{ model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] }],
  });

  const result = {
    productId,
    totalAvailable: rows.reduce((sum, r) => sum + r.availableQuantity, 0),
    totalReserved: rows.reduce((sum, r) => sum + r.reservedQuantity, 0),
    warehouses: rows.map((r) => ({
      warehouseId: r.warehouseId,
      warehouseName: r.warehouse?.name,
      availableQuantity: r.availableQuantity,
      reservedQuantity: r.reservedQuantity,
    })),
  };

  await cache.setInventory(productId, result);
  return { ...result, fromCache: false };
}

module.exports = {
  resolveWarehouseId,
  atomicDeductStock,
  addStock,
  adjustStock,
  getInventoryByProduct,
  totalAvailable,
};
