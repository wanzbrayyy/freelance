// src/routes/jobRoutes.js (FIXED & COMPLETE)
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { protect, authorize, setUserLocals } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(setUserLocals);

// Rute yang lebih spesifik harus di atas
router.get('/create', protect, authorize('client'), jobController.getCreateJob);
router.post('/create', protect, authorize('client'), upload.array('attachments', 5), jobController.postCreateJob);
router.get('/my-posted-jobs', protect, authorize('client'), jobController.getMyPostedJobs); 

// Rute umum dan dinamis
router.get('/', jobController.getJobList);
router.get('/:id', jobController.getJobDetail);

// Rute POST untuk aksi
router.post('/proposal', protect, authorize('freelancer'), jobController.postProposal);
router.post('/accept-proposal', protect, authorize('client'), jobController.acceptProposal);
router.post('/finish', protect, authorize('freelancer'), jobController.markAsFinishedByFreelancer);

// PASTIKAN NAMA FUNGSI INI SESUAI DENGAN YANG DI CONTROLLER
router.post('/complete-and-pay', protect, authorize('client'), jobController.completeJobAndPay);

router.post('/review', protect, jobController.postReview);

module.exports = router;