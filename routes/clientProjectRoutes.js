const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/clientProjectController');
const { protect, authorize } = require('../middleware/auth');

// Client-facing
router.get('/mine', protect, ctrl.getMyProjects);

// Admin-facing
router.get('/clients/list', protect, authorize('admin'), ctrl.listClients);
router.get('/', protect, authorize('admin'), ctrl.getAllProjects);
router.post('/', protect, authorize('admin'), ctrl.createProject);

// Shared (admin or the owning client) — access check happens inside controller
router.get('/:id', protect, ctrl.getProjectById);

router.put('/:id', protect, authorize('admin'), ctrl.updateProject);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteProject);

router.post('/:id/milestones', protect, authorize('admin'), ctrl.addMilestone);
router.put('/:id/milestones/:milestoneId', protect, authorize('admin'), ctrl.updateMilestone);
router.delete('/:id/milestones/:milestoneId', protect, authorize('admin'), ctrl.deleteMilestone);

router.post('/:id/notes', protect, authorize('admin'), ctrl.addNote);

module.exports = router;
