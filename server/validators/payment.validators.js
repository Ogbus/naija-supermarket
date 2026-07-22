const { body, param } = require('express-validator');

const initializePaymentRules = [
  body('order_id').notEmpty().withMessage('order_id is required.')
    .isInt({ min: 1 }).withMessage('Invalid order_id.'),
];

const verifyPaymentRules = [
  param('reference').trim().notEmpty().withMessage('Payment reference is required.')
    .isLength({ max: 200 }).withMessage('Invalid payment reference.'),
];

module.exports = { initializePaymentRules, verifyPaymentRules };
