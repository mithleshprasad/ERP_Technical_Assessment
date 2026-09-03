const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

async function register({ name, email, password, role }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw ApiError.conflict('Email is already registered');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role });
  return sanitize(user);
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  return { token, user: sanitize(user) };
}

function sanitize(user) {
  const { id, name, email, role, createdAt } = user;
  return { id, name, email, role, createdAt };
}

module.exports = { register, login };
