// src/controllers/jobController.js
const Job = require('../models/job');
const User = require('../models/user');
const Proposal = require('../models/proposal');
const Review = require('../models/review');
const { sendNotification } = require('../telegram'); // Impor fungsi notifikasi

// ===================================
//  MENAMPILKAN PEKERJAAN (READ)
// ===================================

// Tampilkan daftar semua pekerjaan yang statusnya 'open'
exports.getJobList = async (req, res) => {
    try {
        const jobs = await Job.find({ status: 'open' })
            .populate('clientId', 'username avatar')
            .sort({ createdAt: -1 });
        res.render('jobs/job-list', { title: 'Daftar Pekerjaan', jobs });
    } catch (err) {
        res.status(500).render('error', { title: 'Error Server', message: 'Gagal mengambil daftar pekerjaan.' });
    }
};

// Tampilkan halaman detail untuk satu pekerjaan
exports.getJobDetail = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('clientId', 'username avatar')
            .populate({
                path: 'proposals',
                populate: {
                    path: 'freelancerId',
                    select: 'username avatar averageRating totalReviews'
                }
            });

        if (!job) {
            return res.status(404).render('error', { title: 'Pekerjaan Tidak Ditemukan', message: 'Pekerjaan yang Anda cari tidak ada.' });
        }

        let hasProposed = false;
        if (res.locals.currentUser && res.locals.currentUser.role === 'freelancer') {
            const existingProposal = await Proposal.findOne({ jobId: job._id, freelancerId: res.locals.currentUser._id });
            if (existingProposal) hasProposed = true;
        }

        res.render('jobs/job-detail', { title: job.title, job, hasProposed });
    } catch (err) {
        res.status(500).render('error', { title: 'Error Server', message: 'Gagal mengambil detail pekerjaan.' });
    }
};

// Menampilkan semua pekerjaan yang diposting oleh klien yang sedang login
exports.getMyPostedJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ clientId: req.user._id }).sort({ createdAt: -1 });
        res.render('client/my-posted-jobs', {
            title: 'Pekerjaan yang Saya Posting', user: req.user,
            jobs, active: 'my-jobs'
        });
    } catch (err) {
        res.status(500).render('error', { title: 'Error Server', message: 'Gagal mengambil data pekerjaan.' });
    }
};

// ===================================
//  MEMBUAT PEKERJAAN (CREATE)
// ===================================

// Tampilkan form untuk membuat pekerjaan baru
exports.getCreateJob = (req, res) => {
    res.render('jobs/create-job', {
        title: 'Buat Pekerjaan Baru', error: req.query.error
    });
};

// Proses data dari form pembuatan pekerjaan baru
exports.postCreateJob = async (req, res) => {
    try {
        const { title, description, category, budget, deadline } = req.body;
        const attachments = req.files ? req.files.map(file => file.path) : [];

        const newJob = await Job.create({
            clientId: req.user._id, title, description,
            category, budget, deadline, attachments
        });

        res.redirect(`/jobs/${newJob._id}`);
    } catch (err) {
        let errorMessage = 'Gagal membuat pekerjaan baru.';
        if (err.name === 'ValidationError') {
            errorMessage = Object.values(err.errors).map(val => val.message).join(', ');
        }
        res.redirect(`/jobs/create?error=${encodeURIComponent(errorMessage)}`);
    }
};

// ===================================
//  PROSES PROPOSAL & PEKERJAAN
// ===================================

// Proses pengajuan proposal oleh freelancer
exports.postProposal = async (req, res) => {
    try {
        const { jobId, coverLetter, proposedBudget, deliveryTime } = req.body;
        const existingProposal = await Proposal.findOne({ jobId: jobId, freelancerId: req.user._id });
        if (existingProposal) {
            return res.status(400).json({ success: false, message: 'Anda sudah mengajukan proposal untuk pekerjaan ini.' });
        }
        const proposal = await Proposal.create({
            jobId, freelancerId: req.user._id, coverLetter,
            proposedBudget, deliveryTime
        });

        const job = await Job.findByIdAndUpdate(jobId, { $push: { proposals: proposal._id } });

        // Kirim Notifikasi Telegram ke Klien
        const client = await User.findById(job.clientId);
        if (client && client.telegramId) {
            const notifMessage = `*🔔 Proposal Baru Diterima!*\n\nAnda menerima proposal baru untuk pekerjaan *${job.title}* dari freelancer *${req.user.username}*.`;
            await sendNotification(client.telegramId, notifMessage);
        }

        res.json({ success: true, message: 'Proposal berhasil diajukan!' });
    } catch (err) {
        let errorMessage = 'Gagal mengajukan proposal.';
        if (err.name === 'ValidationError') {
            errorMessage = Object.values(err.errors).map(val => val.message).join(', ');
        }
        res.status(500).json({ success: false, message: errorMessage });
    }
};

// Proses penerimaan proposal oleh klien
exports.acceptProposal = async (req, res) => {
    try {
        const { jobId, proposalId } = req.body;
        const job = await Job.findById(jobId);
        if (!job || job.clientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Anda tidak memiliki izin.' });
        }
        if (job.status !== 'open') {
            return res.status(400).json({ success: false, message: 'Pekerjaan ini tidak lagi terbuka.' });
        }
        const proposal = await Proposal.findById(proposalId);
        if (!proposal) {
            return res.status(404).json({ success: false, message: 'Proposal tidak ditemukan.' });
        }
        job.status = 'in-progress';
        job.acceptedFreelancer = proposal.freelancerId;
        await job.save();
        proposal.status = 'accepted';
        await proposal.save();
        await Proposal.updateMany({ jobId: jobId, _id: { $ne: proposalId } }, { status: 'rejected' });

        // Kirim Notifikasi Telegram ke Freelancer yang Diterima
        const freelancer = await User.findById(proposal.freelancerId);
        if (freelancer && freelancer.telegramId) {
            const notifMessage = `*🎉 Selamat! Proposal Anda Diterima!*\n\nProposal Anda untuk pekerjaan *${job.title}* telah diterima oleh klien *${req.user.username}*. Proyek telah dimulai!`;
            await sendNotification(freelancer.telegramId, notifMessage);
        }

        res.json({ success: true, message: 'Proposal berhasil diterima dan pekerjaan dimulai!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal menerima proposal.' });
    }
};

// Menyelesaikan pekerjaan
exports.completeJob = async (req, res) => {
    try {
        const { jobId } = req.body;
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Pekerjaan tidak ditemukan.' });
        }
        if (job.clientId.toString() !== req.user._id.toString() && job.acceptedFreelancer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Anda tidak memiliki izin.' });
        }
        if (job.status === 'in-progress') {
            job.status = 'completed';
            await job.save();
            await User.findByIdAndUpdate(job.acceptedFreelancer, {
                $inc: { earnings: job.budget, completedJobs: 1 }
            });

            // Kirim Notifikasi ke Klien dan Freelancer
            const client = await User.findById(job.clientId);
            const freelancer = await User.findById(job.acceptedFreelancer);
            const notifMessage = `*✅ Pekerjaan Selesai!*\n\nPekerjaan *${job.title}* telah ditandai sebagai selesai. Silakan berikan ulasan Anda.`;
            if (client && client.telegramId) await sendNotification(client.telegramId, notifMessage);
            if (freelancer && freelancer.telegramId) await sendNotification(freelancer.telegramId, notifMessage);
            
            res.json({ success: true, message: 'Pekerjaan berhasil diselesaikan!' });
        } else {
            res.status(400).json({ success: false, message: `Pekerjaan ini tidak dalam status 'in-progress'.` });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal menyelesaikan pekerjaan.' });
    }
};

// Memberikan review setelah pekerjaan selesai
exports.postReview = async (req, res) => {
    try {
        const { jobId, reviewedUser, rating, comment } = req.body;
        const job = await Job.findById(jobId);
        if (!job || job.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Review hanya bisa diberikan pada pekerjaan yang sudah selesai.' });
        }
        const isParticipant = req.user._id.toString() === job.clientId.toString() || req.user._id.toString() === job.acceptedFreelancer.toString();
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Anda tidak terlibat dalam pekerjaan ini.' });
        }
        const existingReview = await Review.findOne({ jobId, reviewer: req.user._id });
        if (existingReview) {
            return res.status(400).json({ success: false, message: 'Anda sudah memberikan review untuk pekerjaan ini.' });
        }
        await Review.create({
            jobId, reviewer: req.user._id, reviewedUser, rating, comment
        });
        res.json({ success: true, message: 'Review berhasil ditambahkan!' });
    } catch (err) {
        let errorMessage = 'Gagal menambahkan review.';
        if (err.name === 'ValidationError') {
            errorMessage = Object.values(err.errors).map(val => val.message).join(', ');
        }
        res.status(500).json({ success: false, message: errorMessage });
    }
};