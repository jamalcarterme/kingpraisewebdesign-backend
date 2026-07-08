const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    country: { type: String, trim: true },
    role: { type: String, enum: ['admin', 'client'], default: 'client' },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    isActive: { type: Boolean, default: true },
    refreshTokens: [{ type: String }], // supports multiple active sessions/devices
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
