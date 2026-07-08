const express = require('express');
const router = express.Router();
const {
  createContactMessage,
  getContactMessages,
  markAsRead,
  deleteContactMessage,
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', createContactMessage);
router.get('/', protect, authorize('admin'), getContactMessages);
router.put('/:id/read', protect, authorize('admin'), markAsRead);
router.delete('/:id', protect, authorize('admin'), deleteContactMessage);

module.exports = router;
