const express = require('express');
const router = express.Router();
const { getTeam, createTeamMember, updateTeamMember, deleteTeamMember } = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getTeam);
router.post('/', protect, authorize('admin'), upload.single('photo'), createTeamMember);
router.put('/:id', protect, authorize('admin'), upload.single('photo'), updateTeamMember);
router.delete('/:id', protect, authorize('admin'), deleteTeamMember);

module.exports = router;
