// src/controllers/freelancerController.js
const Proposal = require('../models/proposal');
const Job = require('../models/job');

// Menampilkan semua proposal yang telah diajukan oleh freelancer
exports.getMyProposals = async (req, res) => {
    try {
        const proposals = await Proposal.find({ freelancerId: req.user._id })
            .populate('jobId', 'title status') // Ambil judul dan status dari model Job
            .sort({ createdAt: -1 }); // Urutkan dari yang terbaru

        res.render('freelancer/my-proposals', {
            title: 'Proposal Saya',
            user: req.user, // User dari middleware protect
            proposals: proposals,
            active: 'proposals' // Untuk menandai menu aktif di sidebar
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { title: 'Error Server', message: 'Gagal mengambil data proposal.' });
    }
};

// Menampilkan semua pekerjaan yang sedang/telah dikerjakan oleh freelancer
exports.getAppliedJobs = async (req, res) => {
    try {
        // Cari pekerjaan di mana freelancer ini diterima
        const jobs = await Job.find({ acceptedFreelancer: req.user._id })
            .populate('clientId', 'username avatar') // Ambil info klien
            .sort({ updatedAt: -1 });

        res.render('freelancer/applied-jobs', {
            title: 'Pekerjaan Saya',
            user: req.user,
            jobs: jobs,
            active: 'applied-jobs'
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { title: 'Error Server', message: 'Gagal mengambil data pekerjaan.' });
    }
};