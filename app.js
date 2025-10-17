// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Konfigurasi Database (MongoDB)
require('./src/config/db');

// Konfigurasi Cloudinary (jika belum ada, akan dibuat di src/config)
// require('./src/config/cloudinary'); // Uncomment if you create a separate cloudinary config file

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Robots.txt
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(__dirname, 'robots.txt'));
});

// Routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const jobRoutes = require('./src/routes/jobRoutes');
// const chatRoutes = require('./src/routes/chatRoutes'); // Akan datang

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/jobs', jobRoutes);
// app.use('/chat', chatRoutes); // Akan datang

// Home Route
app.get('/', (req, res) => {
    res.render('index', { title: 'Job Freelance - Temukan Pekerjaan Impianmu' });
});

// Kebijakan, Syarat & Ketentuan
app.get('/privacy-policy', (req, res) => res.render('privacy-policy', { title: 'Kebijakan Privasi' }));
app.get('/terms-of-service', (req, res) => res.render('terms-of-service', { title: 'Ketentuan Layanan' }));
app.get('/cookie-policy', (req, res) => res.render('cookie-policy', { title: 'Kebijakan Cookie' }));

// Dashboard Routes (Contoh)
app.get('/dashboard/freelancer', (req, res) => {
    // Implementasi otentikasi dan data freelancer
    res.render('dashboard/freelancer-dashboard', {
        title: 'Dashboard Freelancer',
        user: {
            name: 'Alex',
            role: 'freelancer',
            avatar: '/images/default-avatar.png', // Placeholder
            online: true,
            earnings: 12500,
            completed: 35,
            rating: 4.9,
            currentProjects: [
                { id: 1, title: 'Website Redesign', status: 'In Progress' },
                { id: 2, title: 'Mobile App Development', status: 'Pending Review' }
            ]
        }
    });
});

app.get('/dashboard/client', (req, res) => {
    res.render('dashboard/client-dashboard', {
        title: 'Dashboard Client',
        user: { name: 'Client Name', role: 'client' }
    });
});
app.use((req, res, next) => {
    res.status(404).render('error', { title: 'Halaman Tidak Ditemukan', message: 'Halaman yang Anda cari tidak ada.' });
});
io.on('connection', (socket) => {
    console.log('A user connected for chat');

    socket.on('join_chat', (data) => {
        socket.join(data.chatRoomId); 
        console.log(`User ${socket.id} joined room ${data.chatRoomId}`);
    });

    socket.on('send_message', (data) => {
        io.to(data.chatRoomId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected from chat');
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));