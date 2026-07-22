const { body, param } = require('express-validator');

const updateInventoryRules = [
  param('productId').isInt({ min: 1 }).withMessage('Invalid product id.'),
  body('quantity_in_stock').optional({ checkFalsy: true }).isInt({ min: 0 })
    .withMessage('Quantity in stock must be zero or more.'),
  body('low_stock_threshold').optional({ checkFalsy: true }).isInt({ min: 0 })
    .withMessage('Low stock threshold must be zero or more.'),
];

module.exports = { updateInventoryRules };
