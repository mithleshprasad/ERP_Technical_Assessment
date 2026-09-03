const { Op } = require('sequelize');
const { Product } = require('../models');
const ApiError = require('../utils/ApiError');
const cache = require('./cache.service');

async function createProduct(data) {
  const existing = await Product.findOne({ where: { sku: data.sku } });
  if (existing) throw ApiError.conflict(`SKU '${data.sku}' already exists`);

  const product = await Product.create(data);
  await cache.invalidateProductLists();
  return product;
}

async function listProducts({ page, limit, search }) {
  const cached = await cache.getProductList(page, limit, search);
  if (cached) return { ...cached, fromCache: true };

  const where = search ? { name: { [Op.like]: `%${search}%` } } : {};
  const { rows, count } = await Product.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  const result = {
    data: rows,
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };

  await cache.setProductList(page, limit, search, result);
  return { ...result, fromCache: false };
}

async function getProductById(id) {
  const product = await Product.findByPk(id);
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

async function updateProduct(id, data) {
  const product = await getProductById(id);

  if (data.sku && data.sku !== product.sku) {
    const clash = await Product.findOne({ where: { sku: data.sku } });
    if (clash) throw ApiError.conflict(`SKU '${data.sku}' already exists`);
  }

  await product.update(data);
  await cache.invalidateProductLists();
  return product;
}

async function deleteProduct(id) {
  const product = await getProductById(id);
  await product.destroy(); // soft delete (paranoid model)
  await cache.invalidateProductLists();
}

module.exports = { createProduct, listProducts, getProductById, updateProduct, deleteProduct };
