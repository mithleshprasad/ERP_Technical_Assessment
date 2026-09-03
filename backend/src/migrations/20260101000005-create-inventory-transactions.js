module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventory_transactions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
      },
      warehouse_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'warehouses', key: 'id' },
        onDelete: 'CASCADE',
      },
      type: { type: Sequelize.ENUM('IN', 'OUT', 'ADJUSTMENT'), allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      reference_id: { type: Sequelize.STRING(120), allowNull: true },
      note: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('inventory_transactions', ['product_id'], { name: 'idx_invtx_product' });
    await queryInterface.addIndex('inventory_transactions', ['reference_id'], { name: 'idx_invtx_reference' });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('inventory_transactions');
  },
};
