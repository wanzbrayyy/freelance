// src/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chatRoomId: { // Bisa berupa ID proyek, atau ID chatroom khusus antara 2 user
        type: String, // String karena bisa kombinasi ID user atau ID job
        required: true
    },
    sender: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: { // Opsional, jika chat 1-on-1
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    messageText: {
        type: String,
        required: [true, 'Pesan tidak boleh kosong']
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);