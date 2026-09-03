module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING(160), allowNull: false },
      sku: { type: Sequelize.STRING(60), allowNull: false, unique: true },
      price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('products', ['name'], { name: 'idx_products_name' });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('products');
  },
};
