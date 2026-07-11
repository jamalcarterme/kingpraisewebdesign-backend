require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const User = require('./models/User');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ✅ FIX 1: Trust the proxy (Render.com)
app.set('trust proxy', 1);

// ===== Core middleware =====
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// Basic rate limiting on auth + write-heavy public endpoints to slow down abuse
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/auth', publicLimiter);
app.use('/api/bookings', publicLimiter);
app.use('/api/contact', publicLimiter);

// ✅ FIX 2: Custom upload limiter that respects user authentication
const uploadLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 50,  // 50 uploads per 15 minutes per user
  keyGenerator: (req) => req.user?.id || req.ip  // Use user ID if authenticated, fall back to IP
});
app.use('/api/projects', uploadLimiter);

// ===== Routes =====
app.get('/', (req, res) => res.json({ success: true, message: 'King Praise Web Design API is running' }));
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/blog', require('./routes/blogRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/team', require('./routes/teamRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/testimonials', require('./routes/testimonialRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/client-projects', require('./routes/clientProjectRoutes'));

app.use(notFound);
app.use(errorHandler);

// Creates a first admin account automatically if none exists yet, using the
// ADMIN_BOOTSTRAP_* values from .env. Safe to leave in — it only ever runs
// once (it no-ops as soon as any admin account exists).
const bootstrapAdmin = async () => {
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) return;

  const { ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_PASSWORD, ADMIN_BOOTSTRAP_NAME } = process.env;
  if (!ADMIN_BOOTSTRAP_EMAIL || !ADMIN_BOOTSTRAP_PASSWORD) {
    console.log('No admin exists yet, and ADMIN_BOOTSTRAP_EMAIL/PASSWORD not set — skipping auto-create.');
    return;
  }

  await User.create({
    name: ADMIN_BOOTSTRAP_NAME || 'Admin',
    email: ADMIN_BOOTSTRAP_EMAIL,
    password: ADMIN_BOOTSTRAP_PASSWORD,
    role: 'admin',
  });
  console.log(`Bootstrap admin created: ${ADMIN_BOOTSTRAP_EMAIL} — change this password after first login!`);
};

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await bootstrapAdmin();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
