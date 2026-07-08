const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    client: { type: String, trim: true },
    category: {
      type: String,
      enum: ['Website', 'Mobile App', 'Custom Software', 'E-Commerce', 'Web Application', 'Other'],
      default: 'Website',
    },
    description: { type: String, required: true },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    liveUrl: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    country: { type: String, trim: true },
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
