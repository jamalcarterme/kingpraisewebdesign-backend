const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/onboardingController');

router.post('/paystack/webhook', ctrl.paystackWebhook);
router.get('/verify/:reference', ctrl.verifyPayment);

module.exports = router;
