const express = require('express');
const router = express.Router();
const {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require('../controllers/testimonialController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getTestimonials);
router.post('/', protect, authorize('admin'), upload.single('photo'), createTestimonial);
router.put('/:id', protect, authorize('admin'), upload.single('photo'), updateTestimonial);
router.delete('/:id', protect, authorize('admin'), deleteTestimonial);

module.exports = router;
