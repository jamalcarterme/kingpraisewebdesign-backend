const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  refreshCookieOptions,
} = require('../utils/generateTokens');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  company: user.company,
  country: user.country,
  phone: user.phone,
  avatar: user.avatar,
});

// @route POST /api/auth/register  (clients only self-register)
const registerClient = async (req, res, next) => {
  try {
    const { name, email, password, phone, company, country } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password, phone, company, country, role: 'client' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie('refreshToken', refreshToken, refreshCookieOptions());
    res.status(201).json({ success: true, accessToken, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/login  (works for both client and admin accounts)
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) user.refreshTokens.shift(); // cap stored sessions
    await user.save();

    res.cookie('refreshToken', refreshToken, refreshCookieOptions());
    res.json({ success: true, accessToken, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/admin-login
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase(), role: 'admin' }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie('refreshToken', refreshToken, refreshCookieOptions());
    res.json({ success: true, accessToken, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token provided' });

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(token)) {
      return res.status(401).json({ success: false, message: 'Refresh token invalid, please log in again' });
    }

    const accessToken = generateAccessToken(user);
    res.json({ success: true, accessToken, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Refresh token invalid or expired' });
  }
};

// @route POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded?.id) {
        await User.findByIdAndUpdate(decoded.id, { $pull: { refreshTokens: token } });
      }
    }
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
};

module.exports = { registerClient, login, adminLogin, refresh, logout, getMe };
