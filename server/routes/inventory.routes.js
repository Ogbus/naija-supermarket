const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateInventoryRules } = require('../validators/inventory.validators');

// All inventory routes are admin-only
router.use(authenticate, requireAdmin);

router.get('/', inventoryController.listInventory);
router.get('/low-stock', inventoryController.lowStock);
router.put('/:productId', updateInventoryRules, validate, inventoryController.updateInventory);

module.exports = router;
