const Joi = require('joi');

const createOrder = Joi.object({
  customerId: Joi.string().min(1).max(120).required(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().positive().required(),
      })
    )
    .min(1)
    .required(),
});

const listOrders = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'),
  customerId: Joi.string().max(120),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
});

module.exports = { createOrder, listOrders };
