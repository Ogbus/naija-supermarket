const { body, param, query } = require('express-validator');

const idParamRule = param('id').isInt({ min: 1 }).withMessage('Invalid product id.');

const createProductRules = [
  body('name').trim().notEmpty().withMessage('Product name is required.')
    .isLength({ max: 200 }).withMessage('Product name is too long.'),
  body('price').notEmpty().withMessage('Price is required.')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('category_id').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Invalid category.'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Description is too long.'),
  body('unit').optional({ checkFalsy: true }).trim().isLength({ max: 40 }).withMessage('Unit is too long.'),
  body('sku').optional({ checkFalsy: true }).trim().isLength({ max: 60 }).withMessage('SKU is too long.'),
  body('image_url').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Image URL is too long.'),
  body('initial_stock').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Initial stock must be zero or more.'),
];

const updateProductRules = [
  idParamRule,
  body('name').optional({ checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('Product name is too long.'),
  body('price').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('category_id').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Invalid category.'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Description is too long.'),
  body('unit').optional({ checkFalsy: true }).trim().isLength({ max: 40 }).withMessage('Unit is too long.'),
  body('sku').optional({ checkFalsy: true }).trim().isLength({ max: 60 }).withMessage('SKU is too long.'),
  body('image_url').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Image URL is too long.'),
  body('is_active').optional().isBoolean().withMessage('is_active must be true or false.').toBoolean(),
];

const getProductRules = [idParamRule];

const listProductsRules = [
  query('category').optional({ checkFalsy: true }).trim().isSlug().withMessage('Invalid category filter.'),
  query('search').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Search term is too long.'),
];

module.exports = { createProductRules, updateProductRules, getProductRules, listProductsRules };
