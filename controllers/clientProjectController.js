const ClientProject = require('../models/ClientProject');
const User = require('../models/User');

// GET /api/client-projects/mine  (logged-in client)
const getMyProjects = async (req, res, next) => {
  try {
    const projects = await ClientProject.find({ client: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    next(err);
  }
};

// GET /api/client-projects  (admin - all clients' projects)
const getAllProjects = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.client) filter.client = req.query.client;
    if (req.query.status) filter.status = req.query.status;
    const projects = await ClientProject.find(filter).sort({ createdAt: -1 }).populate('client', 'name email company');
    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    next(err);
  }
};

// GET /api/client-projects/:id
const getProjectById = async (req, res, next) => {
  try {
    const project = await ClientProject.findById(req.params.id).populate('client', 'name email company');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isOwner = project.client._id.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this project' });
    }
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// POST /api/client-projects  (admin - onboard client + create project)
const createProject = async (req, res, next) => {
  try {
    const { clientEmail, projectName, projectType, description, startDate, estimatedEndDate, milestones } = req.body;

    const client = await User.findOne({ email: clientEmail?.toLowerCase(), role: 'client' });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'No client account found with that email. Ask the client to register first, or create the account for them.',
      });
    }

    const project = await ClientProject.create({
      client: client._id,
      projectName,
      projectType,
      description,
      startDate,
      estimatedEndDate,
      milestones: Array.isArray(milestones) ? milestones : [],
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// PUT /api/client-projects/:id  (admin - update project meta)
const updateProject = async (req, res, next) => {
  try {
    const { projectName, projectType, description, status, startDate, estimatedEndDate, progressPercent } = req.body;
    const project = await ClientProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (projectName) project.projectName = projectName;
    if (projectType) project.projectType = projectType;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (startDate) project.startDate = startDate;
    if (estimatedEndDate) project.estimatedEndDate = estimatedEndDate;
    if (progressPercent !== undefined) project.progressPercent = progressPercent;

    await project.save();
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// POST /api/client-projects/:id/milestones  (admin - add milestone)
const addMilestone = async (req, res, next) => {
  try {
    const project = await ClientProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const { title, description, status, dueDate, order } = req.body;
    project.milestones.push({ title, description, status, dueDate, order });
    await project.save();
    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// PUT /api/client-projects/:id/milestones/:milestoneId  (admin - update milestone)
const updateMilestone = async (req, res, next) => {
  try {
    const project = await ClientProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    const { title, description, status, dueDate, order } = req.body;
    if (title) milestone.title = title;
    if (description !== undefined) milestone.description = description;
    if (status) {
      milestone.status = status;
      if (status === 'completed') milestone.completedAt = new Date();
    }
    if (dueDate) milestone.dueDate = dueDate;
    if (order !== undefined) milestone.order = order;

    // auto-recalculate overall progress from milestone completion
    const total = project.milestones.length;
    const completed = project.milestones.filter((m) => m.status === 'completed').length;
    project.progressPercent = total ? Math.round((completed / total) * 100) : project.progressPercent;

    await project.save();
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/client-projects/:id/milestones/:milestoneId  (admin)
const deleteMilestone = async (req, res, next) => {
  try {
    const project = await ClientProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    project.milestones.pull(req.params.milestoneId);
    await project.save();
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// POST /api/client-projects/:id/notes  (admin - add a note visible to client)
const addNote = async (req, res, next) => {
  try {
    const project = await ClientProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    project.notes.push({ text: req.body.text, author: req.user._id });
    await project.save();
    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/client-projects/:id  (admin)
const deleteProject = async (req, res, next) => {
  try {
    const project = await ClientProject.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/client-projects/clients/list  (admin - list all client accounts)
const listClients = async (req, res, next) => {
  try {
    const clients = await User.find({ role: 'client' }).select('name email company country phone createdAt');
    res.json({ success: true, count: clients.length, clients });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyProjects,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  addNote,
  deleteProject,
  listClients,
};
