const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createOrderRules, getOrderRules, listAllOrdersRules, updateOrderStatusRules,
} = require('../validators/order.validators');

router.use(authenticate);

router.post('/', createOrderRules, validate, orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/all', requireAdmin, listAllOrdersRules, validate, orderController.listAllOrders);
router.get('/:id', getOrderRules, validate, orderController.getOrder);
router.put('/:id/status', requireAdmin, updateOrderStatusRules, validate, orderController.updateOrderStatus);

module.exports = router;
