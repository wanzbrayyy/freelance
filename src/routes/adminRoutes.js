// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin'));

router.get('/dashboard', adminController.getDashboard);

router.get('/users', adminController.getUserList);
router.get('/users/:id', adminController.getUserDetail);
router.post('/users/status/:id', adminController.updateUserStatus);
router.post('/users/balance/:id', adminController.updateUserBalance);

router.get('/withdrawals', adminController.getWithdrawalList);
router.post('/withdrawals/process/:id', adminController.processWithdrawal);

module.exports = router;