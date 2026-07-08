const express = require('express');
const router = express.Router();
const { createBooking, getBookings, updateBooking, deleteBooking } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', createBooking);
router.get('/', protect, authorize('admin'), getBookings);
router.put('/:id', protect, authorize('admin'), updateBooking);
router.delete('/:id', protect, authorize('admin'), deleteBooking);

module.exports = router;
