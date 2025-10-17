// src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect, setUserLocals } = require('../middleware/authMiddleware');

router.use(setUserLocals);
router.use(protect); // Semua rute chat memerlukan otentikasi

// Mendapatkan riwayat pesan untuk chat room tertentu
router.get('/:chatRoomId', chatController.getMessages);

// Mengirim pesan (API endpoint, selain via Socket.IO)
router.post('/', chatController.postMessage);

module.exports = router;