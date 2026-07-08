const express = require('express');
const router = express.Router();
const { registerClient, login, adminLogin, refresh, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerClient);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
