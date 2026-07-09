const Project = require('../models/Project');
const cloudinary = require('../config/cloudinary');
const parseBoolean = require('../utils/parseBoolean');

const getProjects = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.featured === 'true') filter.isFeatured = true;
    const projects = await Project.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    next(err);
  }
};

const createProject = async (req, res, next) => {
  try {
    const { title, client, category, description, liveUrl, tags, country, isFeatured, order } = req.body;
    const project = await Project.create({
      title,
      client,
      category,
      description,
      liveUrl,
      country,
      isFeatured: parseBoolean(isFeatured, false),
      order,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      image: req.file ? { url: req.file.path, publicId: req.file.filename } : undefined,
    });
    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const { title, client, category, description, liveUrl, tags, country, isFeatured, order } = req.body;
    if (title) project.title = title;
    if (client !== undefined) project.client = client;
    if (category) project.category = category;
    if (description) project.description = description;
    if (liveUrl !== undefined) project.liveUrl = liveUrl;
    if (country !== undefined) project.country = country;
    if (isFeatured !== undefined) project.isFeatured = parseBoolean(isFeatured, project.isFeatured);
    if (order !== undefined) project.order = order;
    if (tags) project.tags = tags.split(',').map((t) => t.trim());

    if (req.file) {
      if (project.image?.publicId) await cloudinary.uploader.destroy(project.image.publicId).catch(() => {});
      project.image = { url: req.file.path, publicId: req.file.filename };
    }

    await project.save();
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.image?.publicId) await cloudinary.uploader.destroy(project.image.publicId).catch(() => {});
    await project.deleteOne();
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProjects, createProject, updateProject, deleteProject };
