const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { addToCartRules, updateCartItemRules, removeCartItemRules } = require('../validators/cart.validators');

router.use(authenticate); // cart always belongs to a logged-in user

router.get('/', cartController.getCart);
router.post('/', addToCartRules, validate, cartController.addToCart);
router.put('/:itemId', updateCartItemRules, validate, cartController.updateCartItem);
router.delete('/:itemId', removeCartItemRules, validate, cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
