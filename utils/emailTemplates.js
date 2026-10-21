const escapeHtml = require('./escapeHtml');

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' });
const fmtMoney = (amount, currency) =>
  amount ? `${currency} ${Number(amount).toLocaleString('en-NG')}` : null;

const layout = (body) => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#222;line-height:1.6">
<h2 style="margin:0 0 16px">King Praise Web Design</h2>${body}
<hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
<p style="font-size:12px;color:#888">This is an automated message from King Praise Web Design.</p></div>`;

const greeting = (c) => `<p>Hello${c.name ? ` ${escapeHtml(c.name)}` : ''},</p>`;
const scope = (c) => `domain${c.domain ? ` (${escapeHtml(c.domain)})` : ''} and hosting maintenance`;

const welcomeEmail = (c) => {
  const daysAway = (new Date(c.expiryDate) - Date.now()) / 86400000;
  const reminderLine =
    daysAway >= 7
      ? '<b>A reminder email will be sent a week before the renewal date</b>, and a final reminder will be sent a day before it.'
      : '<b>A reminder email will be sent a day before the renewal date.</b>';
  return {
    subject: 'Welcome to King Praise Web Design',
    html: layout(`${greeting(c)}
<p>Welcome aboard! We're delighted to have you as a client.</p>
<p>Once your payment is complete, your ${scope(c)} plan will be active until <b>${fmtDate(c.expiryDate)}</b>. When it is due, we'll email you a secure link to renew it (domain + hosting).</p>
<p>${reminderLine}</p>
<p>If you have any questions, simply reply to this email.</p>`),
  };
};

const reminderEmail = (c, kind, payUrl) => {
  const when = kind === 'week' ? 'in 7 days' : 'tomorrow';
  const price = fmtMoney(c.amount, c.currency);
  return {
    subject: kind === 'week' ? 'Your maintenance renews in a week' : 'Final reminder: your maintenance expires tomorrow',
    html: layout(`${greeting(c)}
<p>This is a ${kind === 'week' ? 'friendly' : '<b>final</b>'} reminder that your ${scope(c)} expires <b>${when}</b> (${fmtDate(c.expiryDate)}).</p>
<p>Renew now to keep your website online and your domain active${price ? ` — renewal cost: <b>${price}</b>` : ''}.</p>
${payUrl
  ? `<p style="margin:24px 0"><a href="${payUrl}" style="background:#111;color:#fff;padding:12px 22px;text-decoration:none;border-radius:6px">Renew now</a></p>`
  : '<p>Please reply to this email and we will send you the payment details.</p>'}`),
  };
};

const receiptEmail = (c, payment) => ({
  subject: 'Payment received — maintenance renewed',
  html: layout(`${greeting(c)}
<p>Thank you! We've received your payment${fmtMoney(payment.amount, payment.currency) ? ` of <b>${fmtMoney(payment.amount, payment.currency)}</b>` : ''}.</p>
<p>Your ${scope(c)} is now active until <b>${fmtDate(c.expiryDate)}</b>. We'll remind you again before the next renewal.</p>`),
});

module.exports = { welcomeEmail, reminderEmail, receiptEmail };
