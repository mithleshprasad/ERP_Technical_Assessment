const Joi = require('joi');

const addStock = Joi.object({
  productId: Joi.string().uuid().required(),
  warehouseId: Joi.string().uuid().optional(),
  quantity: Joi.number().integer().positive().required(),
  note: Joi.string().max(255).allow('').optional(),
});

const adjustStock = Joi.object({
  productId: Joi.string().uuid().required(),
  warehouseId: Joi.string().uuid().optional(),
  // Positive delta increases stock, negative decreases it (e.g. damage/loss write-off).
  quantityDelta: Joi.number().integer().invalid(0).required(),
  note: Joi.string().max(255).allow('').optional(),
});

module.exports = { addStock, adjustStock };
