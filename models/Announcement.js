const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'urgent'], default: 'info' },
    audience: { type: String, enum: ['all', 'clients', 'public'], default: 'all' },
    isPinned: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
