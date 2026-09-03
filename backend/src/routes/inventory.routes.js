const express = require('express');
const controller = require('../controllers/inventory.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { addStock, adjustStock } = require('../validators/inventory.validator');

const router = express.Router();

router.use(authenticate);

router.post('/add-stock', authorize('ADMIN', 'MANAGER'), validate(addStock), controller.addStock);
router.post('/adjust', authorize('ADMIN', 'MANAGER'), validate(adjustStock), controller.adjust);
router.get('/:productId', controller.getByProduct);

module.exports = router;
