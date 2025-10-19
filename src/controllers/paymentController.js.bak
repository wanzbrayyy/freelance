// src/controllers/paymentController.js
const User = require('../models/user');
const Transaction = require('../models/transaction');
const { v4: uuidv4 } = require('uuid'); 
const axios = require('axios'); 
async function checkTransactionStatus(transaction) {
    const { project, amount, order_id, api_key } = {
        project: process.env.PAKASIR_SLUG,
        amount: transaction.amount,
        order_id: transaction.orderId,
        api_key: process.env.PAKASIR_API_KEY
    };

    const url = `https://app.pakasir.com/api/transactiondetail?project=${project}&amount=${amount}&order_id=${order_id}&api_key=${api_key}`;

    try {
        const response = await axios.get(url);
        const pakasirStatus = response.data.transaction.status;

        if (pakasirStatus === 'completed' && transaction.status === 'pending') {
            // Jika di Pakasir sudah lunas, update database kita
            transaction.status = 'completed';
            await transaction.save();
            await User.findByIdAndUpdate(transaction.userId, { $inc: { balance: transaction.amount } });
            console.log(`REKONSILIASI BERHASIL: Transaksi ${transaction.orderId} diperbarui menjadi 'completed'.`);
            return `OK: ${transaction.orderId} - Lunas`;
        } else {
            console.log(`REKONSILIASI INFO: Status untuk ${transaction.orderId} adalah '${pakasirStatus}'.`);
            return `INFO: ${transaction.orderId} - Belum Lunas`;
        }
    } catch (error) {
        console.error(`REKONSILIASI GAGAL untuk ${transaction.orderId}:`, error.response ? error.response.data : error.message);
        return `ERROR: ${transaction.orderId} - ${error.message}`;
    }
}

// Halaman untuk rekonsiliasi manual
exports.getReconciliationPage = async (req, res) => {
    // Amankan halaman ini, hanya untuk admin
    if (req.user.role !== 'admin') { // Asumsi Anda punya role admin
        return res.status(403).send('Akses ditolak.');
    }

    const pendingTransactions = await Transaction.find({ status: 'pending', type: 'deposit' });

    res.render('wallet/reconcile', {
        title: 'Rekonsiliasi Transaksi',
        transactions: pendingTransactions
    });
};

// Aksi untuk menjalankan rekonsiliasi
exports.runReconciliation = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Akses ditolak.');
    }

    const pendingTransactions = await Transaction.find({ status: 'pending', type: 'deposit' });
    const results = [];

    for (const tx of pendingTransactions) {
        const result = await checkTransactionStatus(tx);
        results.push(result);
    }

    res.render('wallet/reconcile', {
        title: 'Hasil Rekonsiliasi',
        transactions: [], // Kosongkan agar tidak tampil lagi
        results: results // Tampilkan hasilnya
    });
};

exports.getWalletPage = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10);
        res.render('wallet/index', {
            title: 'Dompet & Keuangan',
            user: req.user,
            transactions,
            active: 'wallet' // Untuk sidebar
        });
    } catch (err) {
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat halaman dompet.' });
    }
};

// Memulai proses Deposit
exports.createDeposit = async (req, res) => {
    const { amount } = req.body;
    const numericAmount = parseInt(amount, 10);

    if (!numericAmount || numericAmount < 3000) {
        return res.redirect('/wallet?error=Jumlah deposit minimal adalah Rp 3.000');
    }

    try {
        const orderId = `DEP-${req.user._id.toString().slice(-4)}-${Date.now()}`;
        
        await Transaction.create({
            userId: req.user._id,
            type: 'deposit',
            amount: numericAmount,
            status: 'pending',
            orderId: orderId,
        });

        const PAKASIR_SLUG = process.env.PAKASIR_SLUG;
        const redirectUrl = `https://app.pakasir.com/pay/${PAKASIR_SLUG}/${numericAmount}?order_id=${orderId}`;

        res.redirect(redirectUrl);
    } catch (err) {
        res.redirect('/wallet?error=Gagal memulai transaksi.');
    }
};

// Webhook dari Pakasir (SANGAT PENTING)
exports.handleWebhook = async (req, res) => {
    const { order_id, amount, status, project } = req.body;

    if (project !== process.env.PAKASIR_SLUG) {
        return res.status(400).send('Invalid project slug.');
    }

    if (status === 'completed') {
        try {
            const transaction = await Transaction.findOne({ orderId: order_id });
            if (transaction && transaction.status === 'pending' && transaction.amount === amount) {
                transaction.status = 'completed';
                await transaction.save();

                await User.findByIdAndUpdate(transaction.userId, {
                    $inc: { balance: transaction.amount }
                });
                
                console.log(`Saldo untuk user ${transaction.userId} berhasil ditambahkan sebesar ${transaction.amount}`);
                // TODO: Kirim notifikasi ke user via Telegram/Web
            }
        } catch (err) {
            console.error('Webhook processing error:', err);
            return res.status(500).send('Internal Server Error');
        }
    }
    res.status(200).send('Webhook received.');
};

// Memulai proses Withdraw (Penarikan Dana)
exports.createWithdrawal = async (req, res) => {
    const { amount, bank, accountNumber } = req.body;
    const numericAmount = parseInt(amount, 10);
    const user = await User.findById(req.user._id);

    if (!numericAmount || numericAmount < 15000) {
        return res.redirect('/wallet?error=Jumlah penarikan minimal adalah Rp 15.000');
    }
    if (user.balance < numericAmount) {
        return res.redirect('/wallet?error=Saldo Anda tidak mencukupi.');
    }

    try {
        user.balance -= numericAmount;
        await user.save();

        await Transaction.create({
            userId: user._id,
            type: 'withdrawal',
            amount: numericAmount,
            status: 'pending', // Perlu diproses manual oleh admin
            details: { bank, accountNumber }
        });

        res.redirect('/wallet?success=Permintaan penarikan berhasil diajukan dan akan diproses.');
    } catch (err) {
        res.redirect('/wallet?error=Gagal membuat permintaan penarikan.');
    }
};