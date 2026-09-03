const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class JournalEntryLine extends Model {}

  JournalEntryLine.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      journalEntryId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'journal_entry_id',
      },
      account: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      debit: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      credit: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'JournalEntryLine',
      tableName: 'journal_entry_lines',
      underscored: true,
      timestamps: true,
      updatedAt: false,
      indexes: [{ fields: ['journal_entry_id'] }],
    }
  );

  return JournalEntryLine;
};
