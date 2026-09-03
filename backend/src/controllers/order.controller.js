const asyncHandler = require('../utils/asyncHandler');
const orderService = require('../services/order.service');

const create = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body, req.user.id);
  res.status(201).json({ success: true, data: order });
});

const list = asyncHandler(async (req, res) => {
  const result = await orderService.listOrders(req.query);
  res.status(200).json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  res.status(200).json({ success: true, data: order });
});

module.exports = { create, list, getById };
