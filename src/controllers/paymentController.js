// src/controllers/paymentController.js
const User = require('../models/user');
const Transaction = require('../models/transaction');
const { v4: uuidv4 } = require('uuid'); // Install 'uuid': npm install uuid

// Halaman utama untuk keuangan (Deposit & Withdraw)
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

    if (!numericAmount || numericAmount < 10000) {
        return res.redirect('/wallet?error=Jumlah deposit minimal adalah Rp 10.000');
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

    if (!numericAmount || numericAmount < 50000) {
        return res.redirect('/wallet?error=Jumlah penarikan minimal adalah Rp 50.000');
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