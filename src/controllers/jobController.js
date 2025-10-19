// src/controllers/jobController.js
const Job = require('../models/job');
const User = require('../models/user');
const Proposal = require('../models/proposal');
const Review = require('../models/review');
const Transaction = require('../models/transaction');
const { sendNotification } = require('../telegram'); 
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

exports.getJobDetail = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('clientId', 'username avatar balance')
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

exports.getCreateJob = (req, res) => {
    res.render('jobs/create-job', {
        title: 'Buat Pekerjaan Baru', error: req.query.error
    });
};

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
//  PROSES PROPOSAL & SIKLUS HIDUP PEKERJAAN
// ===================================

exports.postProposal = async (req, res) => {
    try {
        const { jobId, coverLetter, proposedBudget, deliveryTime } = req.body;
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Pekerjaan tidak ditemukan.' });
        }
        const existingProposal = await Proposal.findOne({ jobId, freelancerId: req.user._id });
        if (existingProposal) {
            return res.status(400).json({ success: false, message: 'Anda sudah mengajukan proposal untuk pekerjaan ini.' });
        }
        const proposal = await Proposal.create({
            jobId, freelancerId: req.user._id, coverLetter,
            proposedBudget, deliveryTime
        });
        job.proposals.push(proposal._id);
        await job.save();

        const client = await User.findById(job.clientId);
        if (client && client.telegramId) {
            const notifMessage = `*🔔 Proposal Baru Diterima!*\n\nAnda menerima proposal baru untuk pekerjaan *${job.title}* dari freelancer *${req.user.username}*.`;
            await sendNotification(client.telegramId, notifMessage);
        }
        res.json({ success: true, message: 'Proposal berhasil diajukan!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mengajukan proposal.' });
    }
};


exports.acceptProposal = async (req, res) => {
    try {
        const { jobId, proposalId } = req.body;
        const job = await Job.findById(jobId).populate('clientId');
        if (!job || job.clientId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Anda tidak memiliki izin.' });
        }
        if (job.status !== 'open') {
            return res.status(400).json({ success: false, message: 'Pekerjaan ini tidak lagi terbuka.' });
        }
        if (job.clientId.balance < job.budget) {
            return res.status(400).json({ success: false, message: 'Saldo Anda tidak cukup untuk memulai pekerjaan ini. Silakan isi saldo terlebih dahulu.' });
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

        await Proposal.updateMany({ jobId, _id: { $ne: proposalId } }, { status: 'rejected' });

        const freelancer = await User.findById(proposal.freelancerId);
        if (freelancer && freelancer.telegramId) {
            const notifMessage = `*🎉 Selamat! Proposal Anda Diterima!*\n\nProposal Anda untuk pekerjaan *${job.title}* telah diterima oleh klien *${req.user.username}*. Proyek telah dimulai!`;
            await sendNotification(freelancer.telegramId, notifMessage);
        }

        res.json({ success: true, message: 'Freelancer disetujui dan pekerjaan dimulai!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal menerima proposal.' });
    }
};
// src/controllers/jobController.js
// ... (fungsi lainnya)

// FUNGSI INI SEKARANG MENANGANI UPLOAD FILE BUKTI
exports.markAsFinishedByFreelancer = async (req, res) => {
    try {
        const { jobId, notes } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Anda harus mengunggah file gambar sebagai bukti penyelesaian.' });
        }

        const job = await Job.findById(jobId);
        if (!job || !job.acceptedFreelancer || job.acceptedFreelancer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Anda bukan freelancer yang mengerjakan proyek ini.' });
        }
        if (job.status !== 'in-progress') {
            return res.status(400).json({ success: false, message: 'Pekerjaan ini tidak dalam status "in-progress".' });
        }

        // Simpan informasi bukti ke dalam job
        job.completionProof = {
            imageUrl: req.file.path, // URL aman dari Cloudinary
            notes: notes
        };
        job.status = 'review'; // Ubah status menjadi 'review'
        await job.save();

        // Kirim notifikasi ke Klien
        const client = await User.findById(job.clientId);
        if (client && client.telegramId) {
            const notifMessage = `*🔔 Pekerjaan Perlu Direview!*\n\nFreelancer *${req.user.username}* telah menyelesaikan pekerjaan *${job.title}* dan mengirimkan bukti. Silakan periksa dan setujui pembayaran.`;
            await sendNotification(client.telegramId, notifMessage);
        }

        res.json({ success: true, message: 'Bukti berhasil diunggah dan pekerjaan menunggu review dari klien.' });
    } catch (err) {
        console.error('Error in markAsFinishedByFreelancer:', err);
        res.status(500).json({ success: false, message: 'Gagal menandai pekerjaan sebagai selesai.' });
    }
};

// ... (fungsi lainnya)
// DIMODIFIKASI: Saat klien menyetujui dan membayar
exports.completeJobAndPay = async (req, res) => {
    try {
        const { jobId } = req.body;
        const job = await Job.findById(jobId).populate('clientId').populate('acceptedFreelancer');
        if (!job || job.clientId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Hanya klien yang bisa menyetujui penyelesaian.' });
        }
        if (job.status !== 'review') {
            return res.status(400).json({ success: false, message: `Pekerjaan ini belum ditandai selesai oleh freelancer.` });
        }
        if (job.clientId.balance < job.budget) {
            return res.status(400).json({ success: false, message: 'Saldo Anda tidak cukup untuk membayar.' });
        }

        job.clientId.balance -= job.budget;
        job.acceptedFreelancer.balance += job.budget;
        job.status = 'completed';
        
        await job.clientId.save();
        await job.acceptedFreelancer.save();
        await job.save();

        await Transaction.create({ userId: job.clientId._id, type: 'payment', amount: -job.budget, status: 'completed', details: { jobId: job._id, jobTitle: job.title } });
        await Transaction.create({ userId: job.acceptedFreelancer._id, type: 'payout', amount: job.budget, status: 'completed', details: { jobId: job._id, jobTitle: job.title } });

        const notifMessage = `*✅ Pembayaran Berhasil!*\n\nPekerjaan *${job.title}* telah disetujui dan pembayaran sebesar Rp ${job.budget.toLocaleString('id-ID')} telah ditransfer ke saldo Anda.`;
        if (job.acceptedFreelancer.telegramId) {
            await sendNotification(job.acceptedFreelancer.telegramId, notifMessage);
        }
        
        res.json({ success: true, message: 'Pekerjaan berhasil disetujui dan pembayaran telah dikirim!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal menyelesaikan pembayaran.' });
    }
};
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

        // Kirim notifikasi ke pengguna yang di-review
        const userToNotify = await User.findById(reviewedUser);
        if (userToNotify && userToNotify.telegramId) {
            const notifMessage = `*⭐ Ulasan Baru Diterima!*\n\nAnda menerima ulasan baru dari *${req.user.username}* untuk pekerjaan *${job.title}* dengan rating *${rating} bintang*.`;
            await sendNotification(userToNotify.telegramId, notifMessage);
        }
        
        res.json({ success: true, message: 'Review berhasil ditambahkan!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal menambahkan review.' });
    }
};