const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const passwordHash = await bcrypt.hash('Password@123', 10);

    const adminId = uuidv4();
    const managerId = uuidv4();
    const salesId = uuidv4();

    await queryInterface.bulkInsert('users', [
      { id: adminId, name: 'Admin User', email: 'admin@erp.test', password_hash: passwordHash, role: 'ADMIN', created_at: now, updated_at: now },
      { id: managerId, name: 'Manager User', email: 'manager@erp.test', password_hash: passwordHash, role: 'MANAGER', created_at: now, updated_at: now },
      { id: salesId, name: 'Sales User', email: 'sales@erp.test', password_hash: passwordHash, role: 'SALES_USER', created_at: now, updated_at: now },
    ]);

    const warehouseId = uuidv4();
    await queryInterface.bulkInsert('warehouses', [
      { id: warehouseId, name: 'Main Warehouse', location: 'Default', created_at: now, updated_at: now },
    ]);

    const productA = uuidv4();
    const productB = uuidv4();
    await queryInterface.bulkInsert('products', [
      { id: productA, name: 'Product A', sku: 'SKU-A-001', price: 100.0, is_active: true, created_at: now, updated_at: now },
      { id: productB, name: 'Product B', sku: 'SKU-B-001', price: 250.5, is_active: true, created_at: now, updated_at: now },
    ]);

    await queryInterface.bulkInsert('inventories', [
      { id: uuidv4(), product_id: productA, warehouse_id: warehouseId, available_quantity: 5, reserved_quantity: 0, created_at: now, updated_at: now },
      { id: uuidv4(), product_id: productB, warehouse_id: warehouseId, available_quantity: 50, reserved_quantity: 0, created_at: now, updated_at: now },
    ]);

    await queryInterface.bulkInsert('inventory_transactions', [
      { id: uuidv4(), product_id: productA, warehouse_id: warehouseId, type: 'IN', quantity: 5, reference_id: 'SEED', note: 'Initial stock', created_at: now },
      { id: uuidv4(), product_id: productB, warehouse_id: warehouseId, type: 'IN', quantity: 50, reference_id: 'SEED', note: 'Initial stock', created_at: now },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('inventory_transactions', null, {});
    await queryInterface.bulkDelete('inventories', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('warehouses', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
