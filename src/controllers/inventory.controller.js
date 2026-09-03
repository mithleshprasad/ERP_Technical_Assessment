const asyncHandler = require('../utils/asyncHandler');
const inventoryService = require('../services/inventory.service');

const addStock = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.addStock(req.body);
  res.status(200).json({ success: true, data: inventory });
});

const getByProduct = asyncHandler(async (req, res) => {
  const result = await inventoryService.getInventoryByProduct(req.params.productId);
  res.status(200).json({ success: true, data: result });
});

const adjust = asyncHandler(async (req, res) => {
  const result = await inventoryService.adjustStock(req.body);
  res.status(200).json({ success: true, data: result });
});

module.exports = { addStock, getByProduct, adjust };
