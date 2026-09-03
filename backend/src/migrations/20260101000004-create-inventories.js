module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventories', {
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
      available_quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      reserved_quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('inventories', ['product_id', 'warehouse_id'], {
      unique: true,
      name: 'uniq_inventory_product_warehouse',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('inventories');
  },
};
