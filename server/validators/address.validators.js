const { body, param } = require('express-validator');

const createAddressRules = [
  body('label').optional({ checkFalsy: true }).trim().isLength({ max: 40 }).withMessage('Label is too long.'),
  body('street').trim().notEmpty().withMessage('Street address is required.')
    .isLength({ max: 200 }).withMessage('Street address is too long.'),
  body('city').trim().notEmpty().withMessage('City is required.')
    .isLength({ max: 100 }).withMessage('City is too long.'),
  body('state').trim().notEmpty().withMessage('State is required.')
    .isLength({ max: 100 }).withMessage('State is too long.'),
  body('phone').trim().notEmpty().withMessage('Phone number is required.')
    .isLength({ min: 7, max: 20 }).withMessage('Phone number looks invalid.')
    .matches(/^[0-9+()\-\s]+$/).withMessage('Phone number contains invalid characters.'),
  body('is_default').optional().isBoolean().withMessage('is_default must be true or false.').toBoolean(),
];

const deleteAddressRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid address id.'),
];

module.exports = { createAddressRules, deleteAddressRules };
