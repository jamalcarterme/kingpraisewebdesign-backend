const Testimonial = require('../models/Testimonial');
const cloudinary = require('../config/cloudinary');
const parseBoolean = require('../utils/parseBoolean');

const getTestimonials = async (req, res, next) => {
  try {
    const filter = req.query.all === 'true' && req.user?.role === 'admin' ? {} : { isActive: true };
    const testimonials = await Testimonial.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, count: testimonials.length, testimonials });
  } catch (err) {
    next(err);
  }
};

const createTestimonial = async (req, res, next) => {
  try {
    const { name, role, country, rating, quote, order, isActive } = req.body;
    const testimonial = await Testimonial.create({
      name,
      role,
      country,
      rating,
      quote,
      order,
      isActive: parseBoolean(isActive, true),
      source: 'manual',
      photo: req.file ? { url: req.file.path, publicId: req.file.filename } : undefined,
    });
    res.status(201).json({ success: true, testimonial });
  } catch (err) {
    next(err);
  }
};

const updateTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' });

    const { name, role, country, rating, quote, order, isActive } = req.body;
    if (name) testimonial.name = name;
    if (role !== undefined) testimonial.role = role;
    if (country !== undefined) testimonial.country = country;
    if (rating) testimonial.rating = rating;
    if (quote) testimonial.quote = quote;
    if (order !== undefined) testimonial.order = order;
    if (isActive !== undefined) testimonial.isActive = parseBoolean(isActive, testimonial.isActive);

    if (req.file) {
      if (testimonial.photo?.publicId) await cloudinary.uploader.destroy(testimonial.photo.publicId).catch(() => {});
      testimonial.photo = { url: req.file.path, publicId: req.file.filename };
    }

    await testimonial.save();
    res.json({ success: true, testimonial });
  } catch (err) {
    next(err);
  }
};

const deleteTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' });
    if (testimonial.photo?.publicId) await cloudinary.uploader.destroy(testimonial.photo.publicId).catch(() => {});
    await testimonial.deleteOne();
    res.json({ success: true, message: 'Testimonial deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial };
