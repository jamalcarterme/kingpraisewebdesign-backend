const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true }, // e.g. "Lead Developer", "UI/UX Designer"
    bio: { type: String, trim: true, maxlength: 400 },
    photo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    socials: {
      linkedin: { type: String, trim: true },
      twitter: { type: String, trim: true },
      github: { type: String, trim: true },
      instagram: { type: String, trim: true },
    },
    order: { type: Number, default: 0 }, // controls display order
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TeamMember', teamMemberSchema);
