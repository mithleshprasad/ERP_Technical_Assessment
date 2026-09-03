const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class InventoryTransaction extends Model {}

  InventoryTransaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_id',
      },
      warehouseId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'warehouse_id',
      },
      type: {
        type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT'),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      referenceId: {
        type: DataTypes.STRING(120),
        allowNull: true,
        field: 'reference_id',
      },
      note: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'InventoryTransaction',
      tableName: 'inventory_transactions',
      underscored: true,
      timestamps: true,
      updatedAt: false,
      indexes: [{ fields: ['product_id'] }, { fields: ['reference_id'] }],
    }
  );

  return InventoryTransaction;
};
