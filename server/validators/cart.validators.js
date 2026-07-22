const { body, param } = require('express-validator');

const addToCartRules = [
  body('product_id').notEmpty().withMessage('product_id is required.')
    .isInt({ min: 1 }).withMessage('Invalid product_id.'),
  body('quantity').optional({ checkFalsy: true }).isInt({ min: 1, max: 999 })
    .withMessage('Quantity must be between 1 and 999.'),
];

const updateCartItemRules = [
  param('itemId').isInt({ min: 1 }).withMessage('Invalid cart item id.'),
  body('quantity').notEmpty().withMessage('quantity is required.')
    .isInt({ min: 0, max: 999 }).withMessage('Quantity must be between 0 and 999.'),
];

const removeCartItemRules = [
  param('itemId').isInt({ min: 1 }).withMessage('Invalid cart item id.'),
];

module.exports = { addToCartRules, updateCartItemRules, removeCartItemRules };
