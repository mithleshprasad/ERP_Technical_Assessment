const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Order extends Model {}

  Order.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      customerId: {
        type: DataTypes.STRING(120),
        allowNull: false,
        field: 'customer_id',
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      totalAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_amount',
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'created_by',
      },
    },
    {
      sequelize,
      modelName: 'Order',
      tableName: 'orders',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['customer_id'] },
        { fields: ['status'] },
        { fields: ['created_at'] },
        { fields: ['status', 'created_at'] },
      ],
    }
  );

  return Order;
};
