const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

const User = require('./user.model')(sequelize, DataTypes);
const Warehouse = require('./warehouse.model')(sequelize, DataTypes);
const Product = require('./product.model')(sequelize, DataTypes);
const Inventory = require('./inventory.model')(sequelize, DataTypes);
const InventoryTransaction = require('./inventoryTransaction.model')(sequelize, DataTypes);
const Order = require('./order.model')(sequelize, DataTypes);
const OrderItem = require('./orderItem.model')(sequelize, DataTypes);
const JournalEntry = require('./journalEntry.model')(sequelize, DataTypes);
const JournalEntryLine = require('./journalEntryLine.model')(sequelize, DataTypes);

// Product <-> Inventory
Product.hasMany(Inventory, { foreignKey: 'productId', as: 'inventories' });
Inventory.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Warehouse <-> Inventory
Warehouse.hasMany(Inventory, { foreignKey: 'warehouseId', as: 'inventories' });
Inventory.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// Product <-> InventoryTransaction
Product.hasMany(InventoryTransaction, { foreignKey: 'productId', as: 'transactions' });
InventoryTransaction.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Product <-> OrderItem
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// JournalEntry <-> JournalEntryLine
JournalEntry.hasMany(JournalEntryLine, { foreignKey: 'journalEntryId', as: 'lines' });
JournalEntryLine.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'entry' });

// User <-> Order (creator)
User.hasMany(Order, { foreignKey: 'createdBy', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = {
  sequelize,
  User,
  Warehouse,
  Product,
  Inventory,
  InventoryTransaction,
  Order,
  OrderItem,
  JournalEntry,
  JournalEntryLine,
};
