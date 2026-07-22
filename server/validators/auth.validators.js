const { body } = require('express-validator');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.')
    .isLength({ max: 120 }).withMessage('Name is too long.'),
  body('email').trim().isEmail().withMessage('A valid email address is required.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('phone').optional({ checkFalsy: true }).trim()
    .isLength({ min: 7, max: 20 }).withMessage('Phone number looks invalid.')
    .matches(/^[0-9+()\-\s]+$/).withMessage('Phone number contains invalid characters.'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('A valid email address is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

module.exports = { registerRules, loginRules };
