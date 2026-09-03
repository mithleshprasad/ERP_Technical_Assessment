const express = require('express');
const controller = require('../controllers/order.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { createOrder, listOrders } = require('../validators/order.validator');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'MANAGER', 'SALES_USER'), validate(createOrder), controller.create);
router.get('/', authorize('ADMIN', 'MANAGER'), validate(listOrders, 'query'), controller.list);
router.get('/:id', authorize('ADMIN', 'MANAGER'), controller.getById);

module.exports = router;
