// src/routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { protect, authorize, setUserLocals } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(setUserLocals);

// ===================================
//  URUTAN RUTE YANG DIPERBAIKI
// ===================================

// Rute yang lebih spesifik harus di atas
router.get('/create', protect, authorize('client'), jobController.getCreateJob);
router.post('/create', protect, authorize('client'), upload.array('attachments', 5), jobController.postCreateJob);

// Rute ini juga spesifik, jadi letakkan di atas rute dinamis :id
// (Kita akan buat controllernya nanti)
router.get('/my-posted-jobs', protect, authorize('client'), jobController.getMyPostedJobs); 

// Rute dinamis (:id) diletakkan di bawah rute spesifik
router.get('/:id', jobController.getJobDetail);

// Rute lainnya bisa di bawah sini
router.get('/', jobController.getJobList); // Rute root untuk job list
router.post('/proposal', protect, authorize('freelancer'), jobController.postProposal);
router.post('/accept-proposal', protect, authorize('client'), jobController.acceptProposal);
router.post('/complete', protect, jobController.completeJob);
router.post('/review', protect, jobController.postReview);

module.exports = router;