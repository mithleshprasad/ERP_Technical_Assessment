const Joi = require('joi');

const register = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(72).required(),
  role: Joi.string().valid('ADMIN', 'MANAGER', 'SALES_USER').default('SALES_USER'),
});

const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = { register, login };
