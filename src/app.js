const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes');
const optionalAuth = require('./middleware/optionalAuth.middleware');
const rateLimiter = require('./middleware/rateLimiter.middleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler.middleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Decode the JWT (if any) before rate limiting so limits are keyed per
// authenticated user, falling back to per-IP for anonymous requests
// (e.g. /auth/login). Actual auth enforcement happens per-route below.
app.use(optionalAuth);
app.use(rateLimiter);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
