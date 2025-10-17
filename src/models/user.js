const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    username: {
        type: String, required: [true, 'Username wajib diisi'],
        unique: true, trim: true, minlength: [3, 'Username minimal 3 karakter']
    },
    email: {
        type: String, required: [true, 'Email wajib diisi'],
        unique: true, lowercase: true,
        match: [/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/, 'Email tidak valid']
    },
    password: {
        type: String, required: [true, 'Password wajib diisi'],
        minlength: [6, 'Password minimal 6 karakter'], select: false
    },
    role: {
        type: String, enum: ['freelancer', 'client'],
        required: [true, 'Peran pengguna wajib diisi']
    },
    avatar: {
        type: String,
        default: 'https://res.cloudinary.com/dvptl0puc/image/upload/v1760658701/job-freelance/jf-1760658698310-Generated-Image-October-17--2025---2-48AM-png.png'
    },
    bio: {
        type: String, maxlength: [500, 'Bio maksimal 500 karakter'],
        default: ''
    },
    skills: [String],
    portfolio: [
        {
            name: { type: String, required: true },
            link: { type: String, required: true },
            image: { type: String, required: true }
        }
    ],
    onlineStatus: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    telegramId: { type: String, default: null }
}, {
    timestamps: true
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);