// src/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['deposit', 'withdrawal', 'payment', 'payout'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    orderId: { type: String, unique: true, sparse: true }, // Untuk referensi ke payment gateway
    paymentMethod: { type: String },
    details: { type: mongoose.Schema.Types.Mixed } // Untuk menyimpan data tambahan
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);