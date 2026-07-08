const express = require('express');
const router = express.Router();
const { getPosts, getPostBySlug, createPost, updatePost, deletePost } = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getPosts);
router.get('/:slug', getPostBySlug);
router.post('/', protect, authorize('admin'), upload.single('coverImage'), createPost);
router.put('/:id', protect, authorize('admin'), upload.single('coverImage'), updatePost);
router.delete('/:id', protect, authorize('admin'), deletePost);

module.exports = router;
