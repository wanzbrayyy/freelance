const User = require('../models/user');
const jwt = require('jsonwebtoken');

// === Fungsi untuk membuat token JWT ===
const createToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || "wkaoaowkwjenrbrnrejjwwkkw",
    { expiresIn: '1h' }
  );
};

// ===== HALAMAN REGISTER =====
exports.getRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Daftar Akun Baru',
    error: req.query.error || null,
    role: req.query.role || '' // Tambahkan ini biar EJS nggak error
  });
};


// === POST: Proses Register ===
exports.postRegister = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      let errorMessage = existingUser.username === username
        ? 'Username sudah digunakan.'
        : 'Email sudah terdaftar.';
      return res.redirect(`/auth/register?error=${encodeURIComponent(errorMessage)}`);
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'freelancer'
    });

    const token = createToken(user._id, user.role);
    res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 });
    res.redirect(`/dashboard/${user.role}`);
  } catch (err) {
    console.error('Error Register:', err);
    let errorMessage = 'Registrasi gagal. Coba lagi.';
    if (err.name === 'ValidationError') {
      errorMessage = Object.values(err.errors)
        .map(val => val.message)
        .join(', ');
    }
    res.redirect(`/auth/register?error=${encodeURIComponent(errorMessage)}`);
  }
};

// === GET: Halaman Login ===
exports.getLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Masuk ke Akun Anda',
    error: req.query.error || null
  });
};

// === POST: Proses Login ===
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.redirect('/auth/login?error=Email dan password wajib diisi.');
  }

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.redirect('/auth/login?error=Email atau password salah.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.redirect('/auth/login?error=Email atau password salah.');
    }

    if (!user.isActive) {
      return res.redirect('/auth/login?error=Akun Anda telah dinonaktifkan.');
    }

    const token = createToken(user._id, user.role);
    res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 });
    res.redirect(`/dashboard/${user.role}`);
  } catch (err) {
    console.error('Error Login:', err);
    res.redirect('/auth/login?error=Login gagal. Coba lagi.');
  }
};

// === LOGOUT ===
exports.postLogout = (req, res) => {
  res.clearCookie('jwt');
  res.redirect('/');
};

exports.getLogoutAction = (req, res) => {
  res.clearCookie('jwt');
  res.redirect('/');
};
