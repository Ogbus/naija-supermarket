const { body, param } = require('express-validator');

const productIdParamRule = param('id').isInt({ min: 1 }).withMessage('Invalid product id.');

const listReviewsRules = [productIdParamRule];

const upsertReviewRules = [
  productIdParamRule,
  body('rating').notEmpty().withMessage('A rating is required.')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),
  body('comment').optional({ checkFalsy: true }).trim()
    .isLength({ max: 1000 }).withMessage('Review comment is too long (max 1000 characters).'),
];

const deleteReviewRules = [
  productIdParamRule,
  param('reviewId').isInt({ min: 1 }).withMessage('Invalid review id.'),
];

module.exports = { listReviewsRules, upsertReviewRules, deleteReviewRules };
