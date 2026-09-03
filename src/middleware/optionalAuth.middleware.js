const jwt = require('jsonwebtoken');

/**
 * Best-effort JWT decode used only so the rate limiter can key on user id
 * instead of IP whenever a token is present. Never rejects the request -
 * actual auth enforcement for protected routes is done by
 * auth.middleware.js on top of this.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      req.user = { id: payload.sub, role: payload.role, email: payload.email };
    } catch (err) {
      // Invalid/expired token: leave req.user unset, fall back to IP-based limiting.
    }
  }
  next();
}

module.exports = optionalAuth;
