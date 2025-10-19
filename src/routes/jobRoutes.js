// src/routes/jobRoutes.js
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

// Rute POST untuk aksi dalam siklus hidup pekerjaan
router.post('/proposal', protect, authorize('freelancer'), jobController.postProposal);
router.post('/accept-proposal', protect, authorize('client'), jobController.acceptProposal);

// Rute untuk freelancer menandai pekerjaan selesai (dengan upload bukti)
router.post('/finish', protect, authorize('freelancer'), upload.single('proofImage'), jobController.markAsFinishedByFreelancer);

// Rute untuk klien menyetujui pekerjaan dan mentransfer pembayaran
router.post('/complete-and-pay', protect, authorize('client'), jobController.completeJobAndPay);

// Rute untuk memberikan ulasan setelah pekerjaan selesai
router.post('/review', protect, jobController.postReview);

module.exports = router;