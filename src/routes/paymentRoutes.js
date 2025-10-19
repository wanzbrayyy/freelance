// src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, paymentController.getWalletPage);
router.post('/deposit', protect, paymentController.createDeposit);
router.post('/withdraw', protect, paymentController.createWithdrawal);
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;