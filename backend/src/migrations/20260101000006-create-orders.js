module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      customer_id: { type: Sequelize.STRING(120), allowNull: false },
      status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      total_amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('orders', ['customer_id'], { name: 'idx_orders_customer' });
    await queryInterface.addIndex('orders', ['status'], { name: 'idx_orders_status' });
    await queryInterface.addIndex('orders', ['created_at'], { name: 'idx_orders_created_at' });
    // Composite index supports the common "filter by status, sort by recency" query
    // issued by GET /orders?status=COMPLETED (paginated, ORDER BY created_at DESC).
    await queryInterface.addIndex('orders', ['status', 'created_at'], { name: 'idx_orders_status_created_at' });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('orders');
  },
};
