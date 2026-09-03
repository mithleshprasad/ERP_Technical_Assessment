const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class JournalEntry extends Model {}

  JournalEntry.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      referenceId: {
        type: DataTypes.STRING(120),
        allowNull: false,
        field: 'reference_id',
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'JournalEntry',
      tableName: 'journal_entries',
      underscored: true,
      timestamps: true,
      updatedAt: false,
      indexes: [{ fields: ['reference_id'] }],
    }
  );

  return JournalEntry;
};
