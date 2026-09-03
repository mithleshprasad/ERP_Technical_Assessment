const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let { statusCode, message, details } = err;

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'A record with the same unique field already exists';
    details = err.errors?.map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = err.errors?.map((e) => ({ field: e.path, message: e.message }));
  } else if (!(err instanceof ApiError)) {
    statusCode = statusCode || 500;
    message = message || 'Internal server error';
  }

  if (!statusCode || statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.stack || err.message}`);
  }

  res.status(statusCode || 500).json({
    success: false,
    message,
    details: details || undefined,
  });
}

module.exports = { notFoundHandler, errorHandler };
