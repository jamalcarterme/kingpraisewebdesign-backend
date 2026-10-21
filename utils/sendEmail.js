// Sends email through Resend's HTTP API (no SDK needed, Node 18+ fetch).
// Env: RESEND_API_KEY, EMAIL_FROM (verified Resend domain: virtual.kingpraisewebdesign.name.ng)
// Throws on failure so callers can report it; fire-and-forget callers use .catch().
const DEFAULT_FROM = 'King Praise Web Design <no-reply@virtual.kingpraisewebdesign.name.ng>';

const sendEmail = async ({ to, subject, html }) => {
  if (!to) return { skipped: true };
  if (!process.env.RESEND_API_KEY) {
    console.log(`[sendEmail] RESEND_API_KEY not set. Skipped "${subject}" to ${to}`);
    return { skipped: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(process.env.NOTIFY_EMAIL ? { reply_to: process.env.NOTIFY_EMAIL } : {}),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${data.message || JSON.stringify(data)}`);
  return data;
};

module.exports = sendEmail;
