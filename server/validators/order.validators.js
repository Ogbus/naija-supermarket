const { body, param, query } = require('express-validator');

const VALID_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

const createOrderRules = [
  body('address_id').notEmpty().withMessage('address_id is required.')
    .isInt({ min: 1 }).withMessage('Invalid address_id.'),
];

const getOrderRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid order id.'),
];

const listAllOrdersRules = [
  query('status').optional({ checkFalsy: true }).isIn(VALID_STATUSES)
    .withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}`),
];

const updateOrderStatusRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid order id.'),
  body('status').notEmpty().withMessage('status is required.')
    .isIn(VALID_STATUSES).withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}`),
];

module.exports = { createOrderRules, getOrderRules, listAllOrdersRules, updateOrderStatusRules };
