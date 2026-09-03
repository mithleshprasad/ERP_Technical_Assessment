module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('journal_entry_lines', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      journal_entry_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'journal_entries', key: 'id' },
        onDelete: 'CASCADE',
      },
      account: { type: Sequelize.STRING(120), allowNull: false },
      debit: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      credit: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('journal_entry_lines', ['journal_entry_id'], { name: 'idx_jel_journal_entry' });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('journal_entry_lines');
  },
};
