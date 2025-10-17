// src/models/Proposal.js
const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Job',
        required: true
    },
    freelancerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    coverLetter: {
        type: String,
        required: [true, 'Surat lamaran wajib diisi'],
        maxlength: [1000, 'Surat lamaran maksimal 1000 karakter']
    },
    proposedBudget: {
        type: Number,
        required: [true, 'Budget yang diajukan wajib diisi'],
        min: [0, 'Budget tidak boleh negatif']
    },
    deliveryTime: { // Waktu pengiriman yang diajukan (dalam hari)
        type: Number,
        required: [true, 'Waktu pengiriman wajib diisi'],
        min: [1, 'Waktu pengiriman minimal 1 hari']
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
        default: 'pending'
    }
}, {
    timestamps: true
});
proposalSchema.index({ jobId: 1, freelancerId: 1 }, { unique: true });

module.exports = mongoose.model('Proposal', proposalSchema);