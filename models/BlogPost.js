const mongoose = require('mongoose');
const slugify = require('slugify');

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 240 },
    content: { type: String, required: true },
    coverImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    category: { type: String, default: 'General', trim: true },
    tags: [{ type: String, trim: true }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogPostSchema.pre('validate', function (next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    this.slug = `${slugify(this.title, { lower: true, strict: true })}-${Date.now().toString(36)}`;
  }
  next();
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
