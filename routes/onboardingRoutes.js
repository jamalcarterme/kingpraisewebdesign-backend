const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/onboardingController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));
router.route('/').get(ctrl.listClients).post(ctrl.onboardClient);
router.route('/:id').get(ctrl.getClient).put(ctrl.updateClient).delete(ctrl.deleteClient);
router.post('/:id/resend-welcome', ctrl.resendWelcome);
router.post('/:id/send-reminder', ctrl.sendReminderNow);

module.exports = router;
