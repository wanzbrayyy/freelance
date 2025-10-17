const jwt = require('jsonwebtoken');
const User = require('../models/user');

// 🛡️ Middleware untuk melindungi route
exports.protect = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt; // gunakan optional chaining agar tidak crash

    if (!token) {
      return res.redirect('/auth/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    console.error('Protect middleware error:', err.message);
    res.clearCookie('jwt');
    return res.redirect('/auth/login');
  }
};

// 🧩 Middleware untuk role-based authorization
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

// 🌐 Middleware untuk set user ke res.locals agar bisa diakses di EJS
exports.setUserLocals = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt; // aman dari undefined

    if (!token) {
      res.locals.currentUser = null;
      return next();
    }

    // Gunakan secret dari environment variable (bukan hardcoded!)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id).select('-password');

    if (currentUser && currentUser.isActive) {
      res.locals.currentUser = currentUser;
    } else {
      res.locals.currentUser = null;
      res.clearCookie('jwt');
    }
  } catch (err) {
    console.error('setUserLocals error:', err.message);
    res.locals.currentUser = null;
    res.clearCookie('jwt');
  }

  next();
};
