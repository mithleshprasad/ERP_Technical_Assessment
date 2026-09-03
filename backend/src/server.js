require('dotenv').config();
const http = require('http');
const app = require('./app');
const { assertDbConnection } = require('./config/database');
const { initSocket } = require('./services/socket.service');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4000;

async function start() {
  await assertDbConnection();

  const server = http.createServer(app);
  initSocket(server, process.env.CORS_ORIGIN);

  server.listen(PORT, () => {
    logger.info(`Mini ERP backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
