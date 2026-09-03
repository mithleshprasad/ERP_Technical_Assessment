const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Inventory extends Model {}

  Inventory.init(
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
      availableQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'available_quantity',
        validate: { min: 0 },
      },
      reservedQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'reserved_quantity',
        validate: { min: 0 },
      },
    },
    {
      sequelize,
      modelName: 'Inventory',
      tableName: 'inventories',
      underscored: true,
      timestamps: true,
      indexes: [{ unique: true, fields: ['product_id', 'warehouse_id'] }],
    }
  );

  return Inventory;
};
