require('dotenv').config();
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const User = require('./models/user');
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Fungsi pembantu untuk meng-escape karakter MarkdownV2
const escapeMarkdownV2 = (text) => {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
};

// Fungsi untuk mengirim pesan yang selalu dalam format kutipan
async function sendQuotedMessage(telegramId, message) {
    try {
        const escapedMessage = escapeMarkdownV2(message);
        const formattedMessage = escapedMessage.split('\n').map(line => `> ${line}`).join('\n');
        await bot.telegram.sendMessage(telegramId, formattedMessage, { parse_mode: 'MarkdownV2' });
    } catch (error) {
        console.error(`Gagal mengirim pesan kutipan ke ${telegramId}:`, error.description);
        if (error.code === 403) {
            await User.findOneAndUpdate({ telegramId }, { telegramId: null });
        } else if (error.code === 400 && error.description.includes("Can't parse entities")) {
            // Fallback ke plain text jika ada masalah parsing MarkdownV2
            await bot.telegram.sendMessage(telegramId, message);
        }
    }
}

// Menangani perintah /start
bot.start(async (ctx) => {
    const webUserId = ctx.startPayload;
    const telegramId = ctx.from.id;

    if (!webUserId || !mongoose.Types.ObjectId.isValid(webUserId)) {
        // Untuk respons ctx.reply, kita perlu memanggil fungsi pembantu secara manual
        return sendQuotedMessage(telegramId, 'Link aktivasi tidak valid. Silakan coba lagi dari halaman pengaturan di website.');
    }

    try {
        const user = await User.findById(webUserId);
        if (!user) {
            return sendQuotedMessage(telegramId, 'Pengguna tidak ditemukan di website kami.');
        }

        user.telegramId = telegramId;
        await user.save();

        await sendQuotedMessage(telegramId, `🎉 Halo ${user.username}! Akun Anda berhasil terhubung. Anda akan menerima notifikasi di sini.`);

        // Contoh notifikasi yang akan selalu berbentuk kutipan
        await sendQuotedMessage(telegramId, 'Ini adalah notifikasi tes yang selalu dalam kutipan. Anda siap menerima update!');
        await sendQuotedMessage(telegramId, 'Notifikasi lain yang juga otomatis dalam kutipan.');

    } catch (error) {
        console.error('Error saat menghubungkan akun Telegram:', error);
        await sendQuotedMessage(telegramId, 'Terjadi kesalahan di server kami. Silakan coba beberapa saat lagi.');
    }
});

// Contoh perintah lain
bot.help(async (ctx) => {
    await sendQuotedMessage(ctx.from.id, 'Bot ini akan mengirimkan notifikasi dari akun Job Freelance Anda. Semua pesan dari bot ini akan berbentuk kutipan.');
});

module.exports = {
    bot,
    sendNotification: sendQuotedMessage // Ekspor fungsi dengan nama sendNotification agar kompatibel
};

if (require.main === module) {
    mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log('Bot Telegram terhubung ke MongoDB.');
        bot.launch();
        console.log('Bot Telegram sedang berjalan...');
    }).catch(err => console.error('Koneksi DB untuk bot gagal', err));

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}