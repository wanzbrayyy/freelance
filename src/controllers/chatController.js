// src/controllers/chatController.js
const Message = require('../models/message');
const User = require('../models/user');

// Endpoint API untuk mendapatkan riwayat pesan untuk suatu chatRoomId
exports.getMessages = async (req, res) => {
    try {
        const { chatRoomId } = req.params;
        // Hanya izinkan user yang berpartisipasi di chatRoomId untuk melihat pesan
        // Anda perlu menambahkan logika otorisasi di sini, misal:
        // Cek apakah chatRoomId adalah ID Job dan user adalah Client/Freelancer di job itu,
        // atau jika chatRoomId adalah kombinasi ID dua user dan user saat ini adalah salah satunya.

        const messages = await Message.find({ chatRoomId })
            .populate('sender', 'username avatar')
            .sort('timestamp');

        res.json({ success: true, messages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal mengambil pesan.' });
    }
};

// Endpoint API untuk mengirim pesan (juga akan ditangani oleh Socket.IO)
// Ini bisa digunakan sebagai fallback atau untuk API saja, real-time-nya via Socket.IO
exports.postMessage = async (req, res) => {
    try {
        const { chatRoomId, receiverId, messageText } = req.body;
        const senderId = req.user._id;
        const newMessage = await Message.create({
            chatRoomId,
            sender: senderId,
            receiver: receiverId, // Opsional, tergantung implementasi chat
            messageText
        });

        const populatedMessage = await newMessage.populate('sender', 'username avatar');

        // Jika ada Socket.IO, Anda bisa langsung emit di sini juga
        // req.app.get('io').to(chatRoomId).emit('receive_message', populatedMessage);

        res.status(201).json({ success: true, message: 'Pesan berhasil dikirim', data: populatedMessage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal mengirim pesan.' });
    }
};