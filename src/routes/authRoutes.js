// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { setUserLocals } = require('../middleware/authMiddleware');

router.use(setUserLocals);

router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.post('/logout', authController.postLogout);
router.get('/logout-action', authController.getLogoutAction);

module.exports = router;