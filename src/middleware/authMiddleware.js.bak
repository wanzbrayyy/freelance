const jwt = require('jsonwebtoken');
const User = require('../models/user');

// ===== Proteksi Route =====
exports.protect = async (req, res, next) => {
    let token = req.cookies.jwt;

    if (!token) {
        return res.redirect('/auth/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "wkaoaowkwjenrbrnrejjwwkkw");
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            res.clearCookie('jwt');
            return res.redirect('/auth/login');
        }

        if (!req.user.isActive) {
            res.clearCookie('jwt');
            return res.redirect('/auth/login?error=Akun Anda telah dinonaktifkan.');
        }

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
        if (!roles.includes(req.user.role)) {
            return res.status(403).render('error', {
                title: 'Akses Ditolak',
                message: 'Anda tidak memiliki izin untuk mengakses halaman ini.'
            });
        }
        next();
    };
};

// ===== Set User ke res.locals (untuk template EJS misalnya) =====
exports.setUserLocals = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET || "wkaoaowkwjenrbrnrejjwwkkw");
            const currentUser = await User.findById(decoded.id).select('-password');
            if (currentUser && currentUser.isActive) {
                res.locals.currentUser = currentUser;
            } else {
                res.locals.currentUser = null;
                res.clearCookie('jwt');
            }
        } catch (err) {
            res.locals.currentUser = null;
            res.clearCookie('jwt');
        }
    } else {
        res.locals.currentUser = null;
    }
    next();
};
