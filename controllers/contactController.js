const ContactMessage = require('../models/ContactMessage');
const sendEmail = require('../utils/sendEmail');
const escapeHtml = require('../utils/escapeHtml');

const createContactMessage = async (req, res, next) => {
  try {
    const { name, email, business, country, service, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required' });
    }

    const contact = await ContactMessage.create({ name, email, business, country, service, message });

    sendEmail({
      to: process.env.NOTIFY_EMAIL,
      subject: `New Contact Form Submission — ${name}`,
      html: `<h2>New enquiry</h2>
        <p><b>Name:</b> ${escapeHtml(name)}</p>
        <p><b>Email:</b> ${escapeHtml(email)}</p>
        <p><b>Business/Phone:</b> ${escapeHtml(business || '-')}</p>
        <p><b>Country:</b> ${escapeHtml(country || '-')}</p>
        <p><b>Service:</b> ${escapeHtml(service || '-')}</p>
        <p><b>Message:</b><br/>${escapeHtml(message)}</p>`,
    }).catch((e) => console.error('Email error:', e.message));

    res.status(201).json({ success: true, message: "Message sent! We'll be in touch soon.", contact });
  } catch (err) {
    next(err);
  }
};

const getContactMessages = async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ success: true, count: messages.length, messages });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: msg });
  } catch (err) {
    next(err);
  }
};

const deleteContactMessage = async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createContactMessage, getContactMessages, markAsRead, deleteContactMessage };
