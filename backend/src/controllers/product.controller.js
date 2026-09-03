const asyncHandler = require('../utils/asyncHandler');
const productService = require('../services/product.service');
const importService = require('../services/import.service');
const ApiError = require('../utils/ApiError');

const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json({ success: true, data: product });
});

const list = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query);
  res.status(200).json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.status(200).json({ success: true, data: product });
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(200).json({ success: true, data: product });
});

const remove = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.status(204).send();
});

const importProducts = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded (expected multipart field "file")');
  const result = await importService.runProductImport(req.file.buffer);
  res.status(200).json({ success: true, data: result });
});

module.exports = { create, list, getById, update, remove, importProducts };
