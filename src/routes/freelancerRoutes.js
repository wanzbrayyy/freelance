// src/routes/freelancerRoutes.js
const express = require('express');
const router = express.Router();
const freelancerController = require('../controllers/freelancerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Semua rute di file ini dilindungi dan hanya untuk freelancer
router.use(protect, authorize('freelancer'));

router.get('/proposals', freelancerController.getMyProposals);
router.get('/applied-jobs', freelancerController.getAppliedJobs);

module.exports = router;