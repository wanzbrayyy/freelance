// src/app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const Message = require('./models/message');
const { setUserLocals, protect } = require('./middleware/authMiddleware');
const userController = require('./controllers/userController');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const freelancerRoutes = require('./routes/freelancerRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

connectDB();

app.set('io', io);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(setUserLocals);

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/jobs', jobRoutes);
app.use('/freelancer', freelancerRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
    res.render('index', { title: 'Job Freelance - Temukan Pekerjaan Impianmu' });
});

app.get('/dashboard/freelancer', protect, (req, res) => {
    if (req.user.role !== 'freelancer') {
        return res.status(403).render('error', { title: 'Akses Ditolak', message: 'Hanya freelancer yang dapat mengakses dashboard ini.' });
    }
    res.render('dashboard/freelancer-dashboard', { title: 'Dashboard Freelancer', user: req.user });
});

app.get('/dashboard/client', protect, (req, res) => {
    if (req.user.role !== 'client') {
        return res.status(403).render('error', { title: 'Akses Ditolak', message: 'Hanya klien yang dapat mengakses dashboard ini.' });
    }
    res.render('dashboard/client-dashboard', { title: 'Dashboard Client', user: req.user });
});

app.get('/chat/:chatPartnerId', protect, userController.getChatPageWithUser);
app.get('/chat', protect, userController.getChatPage);

app.get('/settings', protect, (req, res) => {
    res.render('settings', { title: 'Pengaturan' });
});

app.get('/privacy-policy', (req, res) => res.render('privacy-policy', { title: 'Kebijakan Privasi' }));
app.get('/terms-of-service', (req, res) => res.render('terms-of-service', { title: 'Ketentuan Layanan' }));
app.get('/cookie-policy', (req, res) => res.render('cookie-policy', { title: 'Kebijakan Cookie' }));

app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(__dirname, '..', 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.sendFile(path.join(__dirname, '..', 'sitemap.xml'));
});

io.on('connection', (socket) => {
    socket.on('join_chat', (data) => {
        socket.join(data.chatRoomId);
    });
    socket.on('send_message', async (data) => {
        try {
            const newMessage = await Message.create({
                chatRoomId: data.chatRoomId, sender: data.senderId,
                receiver: data.receiverId, messageText: data.messageText
            });
            const populatedMessage = await newMessage.populate('sender', 'username avatar');
            io.to(data.chatRoomId).emit('receive_message', populatedMessage);
        } catch (error) {
            socket.emit('chat_error', 'Gagal mengirim pesan Anda.');
        }
    });
});

app.use((req, res, next) => {
    res.status(404).render('error', {
        title: 'Halaman Tidak Ditemukan', message: 'Halaman yang Anda cari tidak ada.'
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));

const { bot } = require('./telegram');
if (process.env.NODE_ENV !== 'test') {
    bot.launch().then(() => {
        console.log('Bot Telegram sedang berjalan...');
    }).catch(err => {
        console.error('Gagal menjalankan bot Telegram:', err);
    });
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));