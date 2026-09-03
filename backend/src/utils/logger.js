const levels = ['error', 'warn', 'info', 'debug'];

function log(level, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

const logger = {};
levels.forEach((level) => {
  logger[level] = (message) => log(level, message);
});

module.exports = logger;
