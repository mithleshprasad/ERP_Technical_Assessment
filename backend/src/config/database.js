const { Sequelize } = require('sequelize');
const config = require('./config')[process.env.NODE_ENV || 'development'];
const logger = require('../utils/logger');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

async function assertDbConnection() {
  try {
    await sequelize.authenticate();
    logger.info('MySQL connection established');
  } catch (err) {
    logger.error(`Unable to connect to MySQL: ${err.message}`);
    throw err;
  }
}

module.exports = { sequelize, assertDbConnection };
