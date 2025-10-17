const jwt = require('jsonwebtoken');
const User = require('../models/user');

// ===== Proteksi Route =====
exports.protect = async (req, res, next) => {
    try {
        const token = req.cookies?.jwt; // aman dari undefined

        if (!token) {
            return res.redirect('/auth/login');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "wkaoaowkwjenrbrnrejjwwkkw");
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            res.clearCookie('jwt');
            return res.redirect('/auth/login');
        }

        if (!user.isActive) {
            res.clearCookie('jwt');
            return res.redirect('/auth/login?error=Akun Anda telah dinonaktifkan.');
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('JWT Verify Error:', err.message);
        res.clearCookie('jwt');
        return res.redirect('/auth/login');
    }
};

// ===== Izin Akses Berdasarkan Role =====
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).render('error', {
                title: 'Akses Ditolak',
                message: 'Anda tidak memiliki izin untuk mengakses halaman ini.'
            });
        }
        next();
    };
};

// ===== Set User ke res.locals (untuk template EJS, dll) =====
exports.setUserLocals = async (req, res, next) => {
    try {
        const token = req.cookies?.jwt; // optional chaining biar gak error
        if (!token) {
            res.locals.currentUser = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "wkaoaowkwjenrbrnrejjwwkkw");
        const currentUser = await User.findById(decoded.id).select('-password');

        if (currentUser && currentUser.isActive) {
            res.locals.currentUser = currentUser;
        } else {
            res.locals.currentUser = null;
            res.clearCookie('jwt');
        }
    } catch (err) {
        console.error('setUserLocals Error:', err.message);
        res.locals.currentUser = null;
        res.clearCookie('jwt');
    }
    next();
};
