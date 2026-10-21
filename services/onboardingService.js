const crypto = require('crypto');
const ClientOnboarding = require('../models/ClientOnboarding');
const sendEmail = require('../utils/sendEmail');
const paystack = require('../utils/paystack');
const { welcomeEmail, reminderEmail, receiptEmail } = require('../utils/emailTemplates');

const DAY = 86400000;
const priceOf = (c) => c.amount ?? (Number(process.env.DEFAULT_RENEWAL_AMOUNT) || 0);

const sendWelcome = async (c) => {
  await sendEmail({ to: c.email, ...welcomeEmail(c, !!c.welcomeSentAt) });
  c.welcomeSentAt = new Date();
  await c.save();
};

// Creates a fresh Paystack checkout link; returns null if payments aren't configured
const createPaymentLink = async (c) => {
  const amount = priceOf(c);
  if (!process.env.PAYSTACK_SECRET_KEY || !amount) return null;
  const reference = `KPWD-${c._id}-${crypto.randomBytes(4).toString('hex')}`;
  const tx = await paystack.initializeTransaction({
    email: c.email,
    amount,
    currency: c.currency,
    reference,
    metadata: { onboardingId: String(c._id), purpose: 'maintenance-renewal' },
  });
  c.payments.push({ reference, amount, currency: c.currency, authorizationUrl: tx.authorization_url });
  return tx.authorization_url;
};

const sendReminder = async (c, kind) => {
  let payUrl = null;
  try {
    payUrl = await createPaymentLink(c);
  } catch (e) {
    console.error(`[reminder] Paystack link failed for ${c.email}:`, e.message);
  }
  await sendEmail({ to: c.email, ...reminderEmail(c, kind, payUrl) });
  c[kind === 'week' ? 'weekReminderSentAt' : 'dayReminderSentAt'] = new Date();
  await c.save();
};

// Idempotent: safe to call from webhook, callback verify, or both.
const settlePayment = async (reference) => {
  const c = await ClientOnboarding.findOne({ 'payments.reference': reference });
  if (!c) return { found: false };
  const payment = c.payments.find((p) => p.reference === reference);
  if (payment.status === 'paid') return { found: true, alreadyPaid: true, onboarding: c };

  const tx = await paystack.verifyTransaction(reference);
  if (tx.status !== 'success') return { found: true, paid: false, status: tx.status, onboarding: c };
  if (tx.amount !== Math.round(payment.amount * 100) || tx.currency !== payment.currency) {
    console.error(`[paystack] Amount mismatch on ${reference}`);
    return { found: true, paid: false, status: 'amount-mismatch', onboarding: c };
  }

  payment.status = 'paid';
  payment.paidAt = new Date();
  // extend from the later of now / current expiry so early renewals don't lose time
  const base = new Date(Math.max(Date.now(), new Date(c.expiryDate).getTime()));
  base.setMonth(base.getMonth() + c.renewalMonths);
  c.expiryDate = base;
  c.status = 'active';
  c.weekReminderSentAt = undefined;
  c.dayReminderSentAt = undefined;
  await c.save();

  sendEmail({ to: c.email, ...receiptEmail(c, payment) }).catch((e) => console.error('Receipt email error:', e.message));
  return { found: true, paid: true, onboarding: c };
};

// Called by the in-process timer and by POST /api/cron/reminders
const runReminders = async () => {
  const now = Date.now();
  const stats = { week: 0, day: 0, expired: 0, errors: 0 };

  const due = await ClientOnboarding.find({
    status: 'active',
    expiryDate: { $lte: new Date(now + 7 * DAY) },
  });

  for (const c of due) {
    const left = new Date(c.expiryDate).getTime() - now;
    try {
      if (left <= 0) {
        c.status = 'expired';
        await c.save();
        stats.expired++;
      } else if (left <= DAY && !c.dayReminderSentAt) {
        await sendReminder(c, 'day');
        stats.day++;
      } else if (left > DAY && left <= 7 * DAY && !c.weekReminderSentAt) {
        await sendReminder(c, 'week');
        stats.week++;
      }
    } catch (e) {
      stats.errors++;
      console.error(`[reminders] ${c.email}:`, e.message);
    }
  }
  return stats;
};

// Hourly check while the server is awake; also runs once at startup.
// On free hosting that sleeps, ping POST /api/cron/reminders from an external cron too.
const startReminderScheduler = () => {
  const tick = () => runReminders().then((s) => (s.week || s.day || s.expired) && console.log('[reminders]', s)).catch((e) => console.error('[reminders]', e.message));
  setTimeout(tick, 10 * 1000);
  setInterval(tick, 60 * 60 * 1000);
};

module.exports = { sendWelcome, sendReminder, settlePayment, runReminders, startReminderScheduler };
