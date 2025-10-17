// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, setUserLocals } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(setUserLocals);

router.get('/profile/:id', userController.getProfile);
router.patch('/profile/:id', protect, userController.updateProfile);

router.post('/profile/avatar', protect, upload.single('avatar'), userController.uploadAvatar);
router.post('/profile/portfolio', protect, upload.single('portfolioImage'), userController.addOrUpdatePortfolio);
router.put('/profile/portfolio/:portfolioId', protect, upload.single('portfolioImage'), userController.addOrUpdatePortfolio);
router.delete('/profile/portfolio/:portfolioId', protect, userController.deletePortfolio);
router.post('/status', protect, userController.setOnlineStatus);
router.post('/deactivate', protect, userController.deactivateAccount);
module.exports = router;