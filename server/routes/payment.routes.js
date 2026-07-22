const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { initializePaymentRules, verifyPaymentRules } = require('../validators/payment.validators');

// Webhook must NOT require our own auth (Paystack calls this directly) - it verifies
// authenticity itself via the x-paystack-signature header instead.
router.post('/webhook', paymentController.webhook);

router.post('/initialize', authenticate, initializePaymentRules, validate, paymentController.initializePayment);
router.get('/verify/:reference', authenticate, verifyPaymentRules, validate, paymentController.verifyPayment);

module.exports = router;
