module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('journal_entries', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      reference_id: { type: Sequelize.STRING(120), allowNull: false },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      description: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('journal_entries', ['reference_id'], { name: 'idx_journal_entries_reference' });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('journal_entries');
  },
};
