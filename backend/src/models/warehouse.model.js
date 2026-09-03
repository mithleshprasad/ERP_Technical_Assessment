const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Warehouse extends Model {}

  Warehouse.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Warehouse',
      tableName: 'warehouses',
      underscored: true,
      timestamps: true,
    }
  );

  return Warehouse;
};
