const Announcement = require('../models/Announcement');

const getAnnouncements = async (req, res, next) => {
  try {
    const filter = req.query.all === 'true' && req.user?.role === 'admin'
      ? {}
      : { isActive: true, $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: new Date() } }] };
    const announcements = await Announcement.find(filter).sort({ isPinned: -1, createdAt: -1 });
    res.json({ success: true, count: announcements.length, announcements });
  } catch (err) {
    next(err);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, announcement });
  } catch (err) {
    next(err);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, announcement });
  } catch (err) {
    next(err);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
