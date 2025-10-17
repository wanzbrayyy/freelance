// src/controllers/userController.js
const User = require('../models/user');
const Message = require('../models/message');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).render('error', { title: 'Profil Tidak Ditemukan', message: 'Pengguna yang Anda cari tidak ditemukan.' });
        }
        res.render('profile/user-profile', { title: `Profil ${user.username}`, user });
    } catch (err) {
        res.status(500).render('error', { title: 'Error Server', message: 'Terjadi kesalahan saat mengambil profil.' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { username, bio, skills } = req.body;
        const userId = req.params.id;
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Anda tidak berwenang.' });
        }
        const updateData = { username, bio };
        if (skills) {
            updateData.skills = skills.split(',').map(s => s.trim()).filter(s => s);
        }
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        }
        res.json({ success: true, message: 'Profil berhasil diperbarui.', user: updatedUser });
    } catch (err) {
        let errorMessage = 'Gagal memperbarui profil.';
        if (err.name === 'ValidationError') {
            errorMessage = Object.values(err.errors).map(val => val.message).join(', ');
        }
        res.status(500).json({ success: false, message: errorMessage });
    }
};

exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah.' });
        }
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        }
        if (user.avatar && !user.avatar.includes('default-avatar')) {
            const publicId = `job-freelance/${user.avatar.split('/').pop().split('.')[0]}`;
            await cloudinary.uploader.destroy(publicId);
        }
        user.avatar = req.file.path;
        await user.save();
        res.json({ success: true, message: 'Avatar berhasil diunggah!', avatarUrl: user.avatar });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mengunggah avatar.' });
    }
};

exports.addOrUpdatePortfolio = async (req, res) => {
    try {
        const { name, link } = req.body;
        const portfolioId = req.params.portfolioId || null;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        }
        const portfolioData = { name, link };
        if (req.file) {
            portfolioData.image = req.file.path;
        }
        if (portfolioId) {
            const portfolioItem = user.portfolio.id(portfolioId);
            if (!portfolioItem) {
                return res.status(404).json({ success: false, message: 'Item portofolio tidak ditemukan.' });
            }
            portfolioItem.set(portfolioData);
        } else {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Gambar portofolio wajib diunggah.' });
            }
            user.portfolio.push(portfolioData);
        }
        await user.save();
        res.json({ success: true, message: 'Portofolio berhasil diperbarui!', portfolio: user.portfolio });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal memperbarui portofolio.' });
    }
};

exports.deletePortfolio = async (req, res) => {
    try {
        const { portfolioId } = req.params;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        }
        const portfolioItem = user.portfolio.id(portfolioId);
        if (!portfolioItem) {
            return res.status(404).json({ success: false, message: 'Item portofolio tidak ditemukan.' });
        }
        if (portfolioItem.image) {
            const publicId = `job-freelance/${portfolioItem.image.split('/').pop().split('.')[0]}`;
            await cloudinary.uploader.destroy(publicId);
        }
        portfolioItem.deleteOne();
        await user.save();
        res.json({ success: true, message: 'Portofolio berhasil dihapus.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal menghapus portofolio.' });
    }
};

exports.setOnlineStatus = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { onlineStatus: req.body.status });
        res.json({ success: true, message: 'Status online diperbarui.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal memperbarui status online.' });
    }
};

async function getUserConversations(userId) {
    const conversations = await Message.aggregate([
        { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
        { $sort: { timestamp: -1 } },
        { $group: { _id: "$chatRoomId", lastMessage: { $first: "$$ROOT" } } },
        { $project: { _id: 0, chatRoomId: "$_id", lastMessage: 1 } }
    ]);
    for (let conv of conversations) {
        const partnerIdStr = conv.chatRoomId.replace('chat_', '').replace(String(userId), '').replace('_', '');
        if (mongoose.Types.ObjectId.isValid(partnerIdStr)) {
            const partnerId = new mongoose.Types.ObjectId(partnerIdStr);
            conv.partner = await User.findById(partnerId).select('username avatar');
        }
    }
    return conversations.filter(c => c.partner);
}

exports.getChatPage = async (req, res) => {
    try {
        const conversations = await getUserConversations(req.user._id);
        res.render('chat', { title: 'Pesan', conversations });
    } catch (err) {
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat halaman chat.' });
    }
};

exports.getChatPageWithUser = async (req, res) => {
    try {
        const { chatPartnerId } = req.params;
        const currentUserId = req.user._id;
        if (!mongoose.Types.ObjectId.isValid(chatPartnerId)) {
            return res.status(400).render('error', { title: 'ID Tidak Valid', message: 'ID pengguna tidak valid.' });
        }
        const chatPartner = await User.findById(chatPartnerId);
        if (!chatPartner) {
            return res.status(404).render('error', { title: 'User Tidak Ditemukan', message: 'Pengguna yang ingin Anda ajak chat tidak ditemukan.' });
        }
        const ids = [currentUserId.toString(), chatPartnerId].sort();
        const chatRoomId = `chat_${ids[0]}_${ids[1]}`;
        const conversations = await getUserConversations(currentUserId);
        res.render('chat', {
            title: `Pesan dengan ${chatPartner.username}`,
            conversations,
            activeChatPartner: chatPartner,
            activeChatRoomId: chatRoomId
        });
    } catch (err) {
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat halaman chat.' });
    }
};

exports.deactivateAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        }
        user.isActive = false;
        await user.save({ validateBeforeSave: false });
        res.clearCookie('jwt');
        res.json({ success: true, message: 'Akun Anda telah berhasil dinonaktifkan.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal menonaktifkan akun.' });
    }
};