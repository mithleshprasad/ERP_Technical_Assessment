const Joi = require('joi');

const createProduct = Joi.object({
  name: Joi.string().min(1).max(160).required(),
  sku: Joi.string().min(1).max(60).required(),
  price: Joi.number().positive().precision(2).required(),
});

const updateProduct = Joi.object({
  name: Joi.string().min(1).max(160),
  sku: Joi.string().min(1).max(60),
  price: Joi.number().positive().precision(2),
}).min(1);

const listProducts = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(160).allow(''),
});

module.exports = { createProduct, updateProduct, listProducts };
