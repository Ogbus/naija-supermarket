const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const {
  createProductRules, updateProductRules, getProductRules, listProductsRules,
} = require('../validators/product.validators');

// Public
router.get('/', listProductsRules, validate, productController.listProducts);
router.get('/categories/all', productController.listCategories);
router.get('/:id', getProductRules, validate, productController.getProduct);

// Admin only
router.post('/', authenticate, requireAdmin, createProductRules, validate, productController.createProduct);
router.put('/:id', authenticate, requireAdmin, updateProductRules, validate, productController.updateProduct);
router.delete('/:id', authenticate, requireAdmin, getProductRules, validate, productController.deleteProduct);
router.post('/upload-image', authenticate, requireAdmin, upload.single('image'), productController.uploadProductImage);

module.exports = router;
