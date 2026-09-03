const express = require('express');
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const inventoryRoutes = require('./inventory.routes');
const orderRoutes = require('./order.routes');

const router = express.Router();

router.get('/health', (req, res) => res.status(200).json({ success: true, status: 'ok' }));

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
