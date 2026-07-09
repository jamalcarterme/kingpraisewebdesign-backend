const TeamMember = require('../models/TeamMember');
const cloudinary = require('../config/cloudinary');
const parseBoolean = require('../utils/parseBoolean');

const getTeam = async (req, res, next) => {
  try {
    const filter = req.query.all === 'true' && req.user?.role === 'admin' ? {} : { isActive: true };
    const team = await TeamMember.find(filter).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, count: team.length, team });
  } catch (err) {
    next(err);
  }
};

const createTeamMember = async (req, res, next) => {
  try {
    const { name, role, bio, order, isActive, linkedin, twitter, github, instagram } = req.body;
    const member = await TeamMember.create({
      name,
      role,
      bio,
      order,
      isActive: parseBoolean(isActive, true),
      socials: { linkedin, twitter, github, instagram },
      photo: req.file ? { url: req.file.path, publicId: req.file.filename } : undefined,
    });
    res.status(201).json({ success: true, member });
  } catch (err) {
    next(err);
  }
};

const updateTeamMember = async (req, res, next) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });

    const { name, role, bio, order, isActive, linkedin, twitter, github, instagram } = req.body;
    if (name) member.name = name;
    if (role) member.role = role;
    if (bio !== undefined) member.bio = bio;
    if (order !== undefined) member.order = order;
    if (isActive !== undefined) member.isActive = parseBoolean(isActive, member.isActive);
    member.socials = {
      linkedin: linkedin ?? member.socials.linkedin,
      twitter: twitter ?? member.socials.twitter,
      github: github ?? member.socials.github,
      instagram: instagram ?? member.socials.instagram,
    };

    if (req.file) {
      if (member.photo?.publicId) await cloudinary.uploader.destroy(member.photo.publicId).catch(() => {});
      member.photo = { url: req.file.path, publicId: req.file.filename };
    }

    await member.save();
    res.json({ success: true, member });
  } catch (err) {
    next(err);
  }
};

const deleteTeamMember = async (req, res, next) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    if (member.photo?.publicId) await cloudinary.uploader.destroy(member.photo.publicId).catch(() => {});
    await member.deleteOne();
    res.json({ success: true, message: 'Team member removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTeam, createTeamMember, updateTeamMember, deleteTeamMember };
