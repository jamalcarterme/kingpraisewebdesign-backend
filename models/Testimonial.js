const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true }, // e.g. "CEO, Larry's Delight"
    country: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    quote: { type: String, required: true },
    photo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    source: { type: String, enum: ['manual', 'google'], default: 'manual' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
