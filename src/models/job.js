// src/models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Judul pekerjaan wajib diisi'],
        trim: true,
        maxlength: [100, 'Judul pekerjaan maksimal 100 karakter']
    },
    description: {
        type: String,
        required: [true, 'Deskripsi pekerjaan wajib diisi']
    },
    category: {
        type: String,
        required: [true, 'Kategori pekerjaan wajib diisi'],
        enum: ['Web Development', 'Mobile App Development', 'UI/UX Design', 'Graphic Design', 'Writing & Translation', 'Digital Marketing', 'Video & Animation', 'Music & Audio', 'Programming & Tech', 'Business', 'Other']
    },
    budget: {
        type: Number,
        required: [true, 'Budget pekerjaan wajib diisi'],
        min: [0, 'Budget tidak boleh negatif']
    },
    deadline: {
        type: Date,
        required: [true, 'Deadline pekerjaan wajib diisi']
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'completed', 'cancelled'],
        default: 'open'
    },
    attachments: [String], // Array of Cloudinary URLs for attached files
    proposals: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Proposal'
        }
    ],
    acceptedFreelancer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    reviewFromClient: {
        type: mongoose.Schema.ObjectId,
        ref: 'Review'
    },
    reviewFromFreelancer: {
        type: mongoose.Schema.ObjectId,
        ref: 'Review'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);