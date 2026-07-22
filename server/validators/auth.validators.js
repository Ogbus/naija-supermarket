const { body } = require('express-validator');
const { isValidNigerianPhone } = require('../utils/phone');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.')
    .isLength({ max: 120 }).withMessage('Name is too long.'),
  body('email').trim().isEmail().withMessage('A valid email address is required.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('phone').optional({ checkFalsy: true }).trim()
    .custom((value) => isValidNigerianPhone(value))
    .withMessage('Enter a valid Nigerian phone number, e.g. 08012345678 or +2348012345678.'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('A valid email address is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

module.exports = { registerRules, loginRules };
