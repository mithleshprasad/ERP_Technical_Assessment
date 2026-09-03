const express = require('express');
const controller = require('../controllers/product.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');
const { createProduct, updateProduct, listProducts } = require('../validators/product.validator');

const router = express.Router();

router.use(authenticate);

router.post('/import', authorize('ADMIN', 'MANAGER'), upload.single('file'), controller.importProducts);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createProduct), controller.create);
router.get('/', validate(listProducts, 'query'), controller.list);
router.get('/:id', controller.getById);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updateProduct), controller.update);
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
