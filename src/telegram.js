// telegram.js
require('dotenv').config();
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const User = require('./models/user'); 
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Fungsi untuk mengirim notifikasi
async function sendNotification(telegramId, message) {
    try {
        await bot.telegram.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
        console.log(`Notifikasi terkirim ke ${telegramId}`);
    } catch (error) {
        console.error(`Gagal mengirim notifikasi ke ${telegramId}:`, error.description);
        // Jika user memblokir bot, nonaktifkan notifikasi untuk mereka
        if (error.code === 403) {
            await User.findOneAndUpdate({ telegramId }, { telegramId: null });
            console.log(`Hubungan Telegram untuk ${telegramId} diputus karena bot diblokir.`);
        }
    }
}

// Menangani perintah /start
// Ini akan dipicu saat user mengklik tombol "Hubungkan ke Telegram"
bot.start(async (ctx) => {
    const webUserId = ctx.startPayload; // Mengambil ID user dari link (misal: ?start=USER_ID)
    const telegramId = ctx.from.id;

    if (!webUserId || !mongoose.Types.ObjectId.isValid(webUserId)) {
        return ctx.reply('Link aktivasi tidak valid. Silakan coba lagi dari halaman pengaturan di website.');
    }

    try {
        const user = await User.findById(webUserId);
        if (!user) {
            return ctx.reply('Pengguna tidak ditemukan di website kami.');
        }

        // Simpan telegramId ke database
        user.telegramId = telegramId;
        await user.save();

        console.log(`User ${user.username} (ID: ${webUserId}) berhasil menghubungkan akun Telegram (ID: ${telegramId})`);
        
        await ctx.reply(`🎉 Halo ${user.username}! Akun Anda berhasil terhubung. Anda akan menerima notifikasi di sini.`);
        
        // Kirim notifikasi tes
        sendNotification(telegramId, 'Ini adalah notifikasi tes. Anda siap menerima update!');

    } catch (error) {
        console.error('Error saat menghubungkan akun Telegram:', error);
        ctx.reply('Terjadi kesalahan di server kami. Silakan coba beberapa saat lagi.');
    }
});

// Contoh perintah lain
bot.help((ctx) => ctx.reply('Bot ini akan mengirimkan notifikasi dari akun Job Freelance Anda.'));

// Ekspor fungsi agar bisa digunakan di controller lain
module.exports = {
    bot,
    sendNotification
};

// Untuk menjalankan bot secara mandiri (opsional)
if (require.main === module) {
    // Koneksi DB jika file ini dijalankan langsung
    mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log('Bot Telegram terhubung ke MongoDB.');
        bot.launch();
        console.log('Bot Telegram sedang berjalan...');
    }).catch(err => console.error('Koneksi DB untuk bot gagal', err));
    
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}