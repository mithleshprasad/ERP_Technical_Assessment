const express = require('express');
const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { register, login } = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', validate(register), controller.register);
router.post('/login', validate(login), controller.login);

module.exports = router;
