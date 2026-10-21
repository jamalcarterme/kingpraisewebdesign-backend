const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true },
    amount: Number,
    currency: String,
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    authorizationUrl: String,
    paidAt: Date,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const clientOnboardingSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, trim: true }, // optional
    domain: { type: String, trim: true }, // optional, shown in emails
    startDate: Date, // when the maintenance plan started
    expiryDate: { type: Date, required: true }, // startDate + renewalMonths; reminders fire relative to this
    amount: { type: Number, min: 0 }, // renewal price in major units; falls back to DEFAULT_RENEWAL_AMOUNT
    currency: { type: String, default: 'NGN', uppercase: true },
    renewalMonths: { type: Number, default: 12, min: 1 },
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
    welcomeSentAt: Date,
    // dedupe flags; cleared whenever expiry changes or a renewal is paid
    weekReminderSentAt: Date,
    dayReminderSentAt: Date,
    payments: [paymentSchema],
    notes: { type: String, trim: true },
    onboardedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClientOnboarding', clientOnboardingSchema);
