const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io = null;

function initSocket(httpServer, corsOrigin) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigin || '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    socket.on('disconnect', () => logger.info(`Socket disconnected: ${socket.id}`));
  });

  return io;
}

/**
 * Emitted only after the owning DB transaction has committed, so clients
 * never learn about a stock change that later rolls back.
 */
function emitInventoryUpdated(payload) {
  if (!io) return;
  io.emit('inventory_updated', payload);
}

module.exports = { initSocket, emitInventoryUpdated };
