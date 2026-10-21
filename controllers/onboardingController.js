const ClientOnboarding = require('../models/ClientOnboarding');
const svc = require('../services/onboardingService');
const { isValidSignature } = require('../utils/paystack');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const addMonths = (d, m) => {
  const r = new Date(d);
  const day = r.getDate();
  r.setMonth(r.getMonth() + m);
  if (r.getDate() !== day) r.setDate(0); // e.g. Jan 31 + 1 month -> Feb 28/29
  return r;
};

// POST /api/onboarding  (admin) — email + startDate required; expiry = startDate + renewalMonths (default 12)
const onboardClient = async (req, res, next) => {
  try {
    const { email, startDate, expiryDate, name, domain, amount, currency, notes } = req.body;
    const months = Number(req.body.renewalMonths) || 12;
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ success: false, message: 'A valid client email is required' });

    const start = startDate ? new Date(startDate) : null;
    if (start && isNaN(start)) return res.status(400).json({ success: false, message: 'A valid startDate is required' });
    const expiry = start ? addMonths(start, months) : new Date(expiryDate);
    if ((!start && !expiryDate) || isNaN(expiry)) return res.status(400).json({ success: false, message: 'A valid plan start date is required' });

    const client = await ClientOnboarding.create({
      email, name, domain, startDate: start || undefined, expiryDate: expiry, amount, currency, renewalMonths: months, notes, onboardedBy: req.user._id,
    });

    // If expiry is under 7 days away the week reminder no longer applies — skip it so it doesn't fire instantly
    if (expiry.getTime() - Date.now() < 7 * 86400000) {
      client.weekReminderSentAt = new Date();
    }
    if (expiry.getTime() <= Date.now()) {
      client.dayReminderSentAt = new Date();
      client.status = 'expired';
    }
    await client.save();

    let emailSent = true;
    let emailError;
    try {
      await svc.sendWelcome(client);
    } catch (e) {
      emailSent = false;
      emailError = e.message;
      console.error('Welcome email error:', e.message);
    }

    res.status(201).json({ success: true, emailSent, emailError, client });
  } catch (err) {
    next(err);
  }
};

// GET /api/onboarding?status=active|expired
const listClients = async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const clients = await ClientOnboarding.find(filter).sort({ expiryDate: 1 });
    res.json({ success: true, count: clients.length, clients });
  } catch (err) {
    next(err);
  }
};

const getClient = async (req, res, next) => {
  try {
    const client = await ClientOnboarding.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, client });
  } catch (err) {
    next(err);
  }
};

// PUT /api/onboarding/:id — changing expiryDate re-arms the reminders
const updateClient = async (req, res, next) => {
  try {
    const client = await ClientOnboarding.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    const { name, domain, amount, currency, renewalMonths, notes, startDate } = req.body;
    let { expiryDate } = req.body;
    if (name !== undefined) client.name = name;
    if (domain !== undefined) client.domain = domain;
    if (amount !== undefined) client.amount = amount;
    if (currency) client.currency = currency;
    if (renewalMonths) client.renewalMonths = Number(renewalMonths);
    if (notes !== undefined) client.notes = notes;
    if (startDate) {
      const sd = new Date(startDate);
      if (isNaN(sd)) return res.status(400).json({ success: false, message: 'Invalid startDate' });
      const changed = !client.startDate || sd.toDateString() !== client.startDate.toDateString();
      client.startDate = sd;
      // only recompute when the start date was changed, so renewals (which extend expiry) aren't overwritten
      if (changed) expiryDate = addMonths(sd, client.renewalMonths || 12);
    }
    if (expiryDate) {
      const d = new Date(expiryDate);
      if (isNaN(d)) return res.status(400).json({ success: false, message: 'Invalid expiryDate' });
      client.expiryDate = d;
      client.status = d > new Date() ? 'active' : 'expired';
      client.weekReminderSentAt = undefined;
      client.dayReminderSentAt = undefined;
    }
    await client.save();
    res.json({ success: true, client });
  } catch (err) {
    next(err);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    const client = await ClientOnboarding.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, message: 'Client removed' });
  } catch (err) {
    next(err);
  }
};

// POST /api/onboarding/:id/resend-welcome
const resendWelcome = async (req, res, next) => {
  try {
    const client = await ClientOnboarding.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    await svc.sendWelcome(client);
    res.json({ success: true, message: 'Welcome email sent' });
  } catch (err) {
    next(err);
  }
};

// POST /api/onboarding/:id/send-reminder  body: { kind: 'week' | 'day' }  (manual trigger / testing)
const sendReminderNow = async (req, res, next) => {
  try {
    const client = await ClientOnboarding.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    await svc.sendReminder(client, req.body.kind === 'day' ? 'day' : 'week');
    res.json({ success: true, message: 'Reminder sent' });
  } catch (err) {
    next(err);
  }
};

// POST /api/cron/reminders  — header x-cron-secret: $CRON_SECRET (for external pingers)
const cronReminders = async (req, res, next) => {
  try {
    if (!process.env.CRON_SECRET || req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
      return res.status(401).json({ success: false, message: 'Invalid cron secret' });
    }
    res.json({ success: true, ...(await svc.runReminders()) });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/paystack/webhook — signature-verified, then re-verified with Paystack's API
const paystackWebhook = async (req, res) => {
  if (!isValidSignature(req.rawBody, req.headers['x-paystack-signature'])) return res.sendStatus(401);
  res.sendStatus(200); // ack fast; Paystack retries on non-200
  try {
    const { event, data } = req.body;
    if (event === 'charge.success' && data?.reference) await svc.settlePayment(data.reference);
  } catch (e) {
    console.error('[paystack webhook]', e.message);
  }
};

// GET /api/payments/verify/:reference — for the post-payment callback page
const verifyPayment = async (req, res, next) => {
  try {
    const r = await svc.settlePayment(req.params.reference);
    if (!r.found) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({
      success: true,
      paid: !!(r.paid || r.alreadyPaid),
      status: r.status,
      expiryDate: r.onboarding?.expiryDate,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  onboardClient, listClients, getClient, updateClient, deleteClient,
  resendWelcome, sendReminderNow, cronReminders, paystackWebhook, verifyPayment,
};
