const Booking = require('../models/Booking');
const sendEmail = require('../utils/sendEmail');

// POST /api/bookings  (public - "Schedule a Call" form)
const createBooking = async (req, res, next) => {
  try {
    const { name, email, phone, company, country, projectType, preferredDate, preferredTime, timezone, message } =
      req.body;

    if (!name || !email || !preferredDate || !preferredTime) {
      return res.status(400).json({ success: false, message: 'Name, email, date and time are required' });
    }

    const booking = await Booking.create({
      name,
      email,
      phone,
      company,
      country,
      projectType,
      preferredDate,
      preferredTime,
      timezone,
      message,
    });

    sendEmail({
      to: process.env.NOTIFY_EMAIL,
      subject: `New Call Booking — ${name}`,
      html: `<h2>New call request</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone || '-'}</p>
        <p><b>Company:</b> ${company || '-'}</p>
        <p><b>Country:</b> ${country || '-'}</p>
        <p><b>Project type:</b> ${projectType || '-'}</p>
        <p><b>Preferred date/time:</b> ${preferredDate} at ${preferredTime} (${timezone || '-'})</p>
        <p><b>Message:</b> ${message || '-'}</p>`,
    }).catch((e) => console.error('Email error:', e.message));

    res.status(201).json({ success: true, message: 'Call request received! We will confirm shortly.', booking });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings  (admin)
const getBookings = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
};

// PUT /api/bookings/:id  (admin - update status)
const updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBooking, getBookings, updateBooking, deleteBooking };
