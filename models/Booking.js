const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    country: { type: String, trim: true },
    projectType: {
      type: String,
      enum: ['Website', 'Mobile App', 'Custom Software', 'Not Sure'],
      default: 'Not Sure',
    },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true }, // e.g. "14:00"
    timezone: { type: String, default: 'Africa/Lagos' },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
