const escapeHtml = require('./escapeHtml');

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' });
const fmtMoney = (amount, currency) =>
  amount ? `${currency} ${Number(amount).toLocaleString('en-NG')}` : null;

const LOGO_URL = process.env.EMAIL_LOGO_URL || 'https://www.kingpraisewebdesign.name.ng/assets/img/logo-full.png';

const layout = (body) => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#222;line-height:1.6">
<div style="background:#000;text-align:center;padding:16px;border-radius:8px 8px 0 0"><img src="${LOGO_URL}" alt="King Praise Web Design" width="150" height="150" style="display:inline-block;border:0;width:150px;height:auto" /></div>
<div style="padding:24px">${body}
<hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
<p style="font-size:12px;color:#888">This is an automated message from King Praise Web Design.</p></div></div>`;

const greeting = (c) => `<p>Hello${c.name ? ` ${escapeHtml(c.name)}` : ''},</p>`;
const scope = (c) => `domain${c.domain ? ` (${escapeHtml(c.domain)})` : ''} and hosting maintenance`;

const fmtDuration = (m) => {
  const n = Number(m) || 12;
  return n % 12 === 0 ? `${n / 12} year${n / 12 > 1 ? 's' : ''} (${n} months)` : `${n} month${n > 1 ? 's' : ''}`;
};

const welcomeEmail = (c) => {
  const daysAway = (new Date(c.expiryDate) - Date.now()) / 86400000;
  const reminderLine =
    daysAway <= 0
      ? '<b>Your renewal is now due.</b> We will send you a secure payment link shortly.'
      : daysAway >= 7
      ? '<b>A reminder email will be sent a week before the renewal date</b>, and a final reminder will be sent a day before it.'
      : '<b>A reminder email will be sent a day before the renewal date.</b>';
  const rows = [
    c.startDate ? ['Plan start date', fmtDate(c.startDate)] : null,
    ['Duration', fmtDuration(c.renewalMonths)],
    ['Expires on', fmtDate(c.expiryDate)],
  ].filter(Boolean);
  const table = `<table style="border-collapse:collapse;margin:12px 0;width:100%">${rows
    .map(([k, v]) => `<tr><td style="padding:8px 12px;border:1px solid #eee;color:#666">${k}</td><td style="padding:8px 12px;border:1px solid #eee"><b>${v}</b></td></tr>`)
    .join('')}</table>`;
  return {
    subject: 'Welcome to King Praise Web Design',
    html: layout(`${greeting(c)}
<p>Welcome aboard! We're delighted to have you as a client.</p>
<p>Here are the details of your ${scope(c)} plan:</p>
${table}
<p>When it is due, we'll email you a secure link to renew it (domain + hosting).</p>
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
