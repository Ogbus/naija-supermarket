const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createAddressRules, deleteAddressRules } = require('../validators/address.validators');

router.use(authenticate);

router.get('/', addressController.listAddresses);
router.post('/', createAddressRules, validate, addressController.createAddress);
router.delete('/:id', deleteAddressRules, validate, addressController.deleteAddress);

module.exports = router;
