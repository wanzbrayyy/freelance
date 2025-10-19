// src/controllers/adminController.js
const User = require('../models/user');
const Job = require('../models/job');
const Transaction = require('../models/transaction');
const mongoose = require('mongoose');

// Halaman Utama Dashboard
exports.getDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalJobs = await Job.countDocuments();
        const activeJobs = await Job.countDocuments({ status: { $in: ['open', 'in-progress'] } });
        const pendingWithdrawals = await Transaction.countDocuments({ type: 'withdrawal', status: 'pending' });
        const latestUsers = await User.find().sort({ createdAt: -1 }).limit(5);
        const latestJobs = await Job.find().populate('clientId', 'username').sort({ createdAt: -1 }).limit(5);
        res.render('admin/dashboard', {
            title: 'Admin Dashboard', layout: 'admin/layout', user: req.user,
            stats: { totalUsers, totalJobs, activeJobs, pendingWithdrawals },
            latestUsers, latestJobs
        });
    } catch (err) {
        res.status(500).render('error', { title: 'Server Error', message: 'Gagal memuat dashboard admin.' });
    }
};

// Manajemen Pengguna
exports.getUserList = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 15;
        const skip = (page - 1) * limit;
        let query = {};
        if (req.query.search) {
            query = { $or: [
                { username: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } }
            ]};
        }
        const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const totalUsers = await User.countDocuments(query);
        res.render('admin/user-list', {
            title: 'Manajemen Pengguna', layout: 'admin/layout', user: req.user,
            users, currentPage: page, totalPages: Math.ceil(totalUsers / limit),
            searchQuery: req.query.search || ''
        });
    } catch (err) {
        res.status(500).render('error', { title: 'Server Error', message: 'Gagal memuat daftar pengguna.' });
    }
};

exports.getUserDetail = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).send('User not found');
        const recentTransactions = await Transaction.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(10);
        res.render('admin/user-detail', {
            title: `Detail Pengguna: ${targetUser.username}`, layout: 'admin/layout', user: req.user,
            targetUser, recentTransactions
        });
    } catch (err) {
        res.status(500).render('error', { title: 'Server Error', message: 'Gagal memuat detail pengguna.' });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        targetUser.isActive = !targetUser.isActive;
        await targetUser.save({ validateBeforeSave: false });
        res.redirect(`/admin/users/${req.params.id}`);
    } catch (err) {
        res.status(500).send('Gagal memperbarui status pengguna.');
    }
};

exports.updateUserBalance = async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const numericAmount = parseInt(amount, 10);
        if (!numericAmount || !reason) return res.status(400).send('Jumlah dan alasan wajib diisi.');
        await User.findByIdAndUpdate(req.params.id, { $inc: { balance: numericAmount } });
        await Transaction.create({
            userId: req.params.id,
            type: 'adjustment', // Tipe baru untuk penyesuaian manual
            amount: numericAmount,
            status: 'completed',
            details: { reason, adjustedBy: req.user.username }
        });
        res.redirect(`/admin/users/${req.params.id}`);
    } catch (err) {
        res.status(500).send('Gagal memperbarui saldo pengguna.');
    }
};

// Manajemen Penarikan (Withdrawal)
exports.getWithdrawalList = async (req, res) => {
    try {
        const pendingWithdrawals = await Transaction.find({ type: 'withdrawal', status: 'pending' })
            .populate('userId', 'username email balance')
            .sort({ createdAt: 'asc' });
        res.render('admin/withdrawals', {
            title: 'Proses Penarikan Dana', layout: 'admin/layout', user: req.user,
            withdrawals: pendingWithdrawals
        });
    } catch (err) {
        res.status(500).render('error', { title: 'Server Error', message: 'Gagal memuat daftar penarikan.' });
    }
};

exports.processWithdrawal = async (req, res) => {
    try {
        const { action } = req.body;
        const transaction = await Transaction.findById(req.params.id).populate('userId');
        if (!transaction || transaction.status !== 'pending' || transaction.type !== 'withdrawal') {
            return res.status(404).send('Transaksi penarikan tidak valid atau sudah diproses.');
        }
        if (action === 'approve') {
            transaction.status = 'completed';
            // Saldo sudah dikurangi saat request dibuat, jadi tidak perlu diubah lagi
        } else if (action === 'reject') {
            transaction.status = 'failed';
            // Kembalikan saldo ke pengguna
            transaction.userId.balance += Math.abs(transaction.amount);
            await transaction.userId.save();
        } else {
            return res.status(400).send('Aksi tidak valid.');
        }
        await transaction.save();
        res.redirect('/admin/withdrawals');
    } catch (err) {
        res.status(500).send('Gagal memproses penarikan.');
    }
};