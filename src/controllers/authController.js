// src/controllers/authController.js
const User = require('../models/user');
const jwt = require('jsonwebtoken');

exports.getRegister = (req, res) => {
    res.render('auth/register', {
        title: 'Daftar Akun Baru', error: req.query.error
    });
};

exports.postRegister = async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            let errorMessage = existingUser.username === username ? 'Username sudah digunakan.' : 'Email sudah terdaftar.';
            return res.redirect(`/auth/register?error=${encodeURIComponent(errorMessage)}`);
        }
        const user = await User.create({ username, email, password, role });
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 });
        res.redirect(`/dashboard/${user.role}`);
    } catch (err) {
        let errorMessage = 'Registrasi gagal. Coba lagi.';
        if (err.name === 'ValidationError') {
            errorMessage = Object.values(err.errors).map(val => val.message).join(', ');
        }
        res.redirect(`/auth/register?error=${encodeURIComponent(errorMessage)}`);
    }
};

exports.getLogin = (req, res) => {
    res.render('auth/login', {
        title: 'Masuk ke Akun Anda', error: req.query.error
    });
};

exports.postLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.redirect('/auth/login?error=Email dan password wajib diisi.');
    }
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.redirect('/auth/login?error=Email atau password salah.');
        }
        if (!user.isActive) {
             return res.redirect('/auth/login?error=Akun Anda telah dinonaktifkan.');
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 });
        res.redirect(`/dashboard/${user.role}`);
    } catch (err) {
        res.redirect('/auth/login?error=Login gagal. Coba lagi.');
    }
};

exports.postLogout = (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/');
};

exports.getLogoutAction = (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/');
};