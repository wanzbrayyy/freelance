// src/models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Job',
        required: true
    },
    reviewer: { // Siapa yang memberikan review (Client atau Freelancer)
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    reviewedUser: { // Siapa yang di-review
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating wajib diisi'],
        min: [1, 'Rating minimal 1'],
        max: [5, 'Rating maksimal 5']
    },
    comment: {
        type: String,
        maxlength: [500, 'Komentar maksimal 500 karakter'],
        default: ''
    }
}, {
    timestamps: true
});

// Middleware untuk mengupdate averageRating dan totalReviews di model User setelah review dibuat/diupdate
reviewSchema.statics.updateUserAverageRating = async function(userId) {
    const obj = await this.aggregate([
        {
            $match: { reviewedUser: userId }
        },
        {
            $group: {
                _id: '$reviewedUser',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    try {
        await mongoose.model('User').findByIdAndUpdate(userId, {
            averageRating: obj[0] ? obj[0].averageRating : 0,
            totalReviews: obj[0] ? obj[0].totalReviews : 0
        });
    } catch (err) {
        console.error('Error updating user average rating:', err);
    }
};

reviewSchema.post('save', function() {
    this.constructor.updateUserAverageRating(this.reviewedUser);
});

reviewSchema.post('remove', function() {
    this.constructor.updateUserAverageRating(this.reviewedUser);
});

module.exports = mongoose.model('Review', reviewSchema);