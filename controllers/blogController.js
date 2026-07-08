const BlogPost = require('../models/BlogPost');
const cloudinary = require('../config/cloudinary');

// GET /api/blog  (public - published only, unless ?all=true and admin)
const getPosts = async (req, res, next) => {
  try {
    const filter = req.query.all === 'true' && req.user?.role === 'admin' ? {} : { status: 'published' };
    if (req.query.category) filter.category = req.query.category;

    const posts = await BlogPost.find(filter).sort({ createdAt: -1 }).populate('author', 'name');
    res.json({ success: true, count: posts.length, posts });
  } catch (err) {
    next(err);
  }
};

// GET /api/blog/:slug
const getPostBySlug = async (req, res, next) => {
  try {
    const post = await BlogPost.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

// POST /api/blog  (admin)
const createPost = async (req, res, next) => {
  try {
    const { title, excerpt, content, category, tags, status } = req.body;
    const post = await BlogPost.create({
      title,
      excerpt,
      content,
      category,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      status: status || 'published',
      author: req.user._id,
      coverImage: req.file ? { url: req.file.path, publicId: req.file.filename } : undefined,
    });
    res.status(201).json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

// PUT /api/blog/:id  (admin)
const updatePost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const { title, excerpt, content, category, tags, status } = req.body;
    if (title) post.title = title;
    if (excerpt) post.excerpt = excerpt;
    if (content) post.content = content;
    if (category) post.category = category;
    if (tags) post.tags = tags.split(',').map((t) => t.trim());
    if (status) post.status = status;

    if (req.file) {
      if (post.coverImage?.publicId) {
        await cloudinary.uploader.destroy(post.coverImage.publicId).catch(() => {});
      }
      post.coverImage = { url: req.file.path, publicId: req.file.filename };
    }

    await post.save();
    res.json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/blog/:id  (admin)
const deletePost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.coverImage?.publicId) {
      await cloudinary.uploader.destroy(post.coverImage.publicId).catch(() => {});
    }
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPosts, getPostBySlug, createPost, updatePost, deletePost };
