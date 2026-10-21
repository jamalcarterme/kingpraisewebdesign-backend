// Sends email through Resend's HTTP API (no SDK needed, Node 18+ fetch).
// Env: RESEND_API_KEY, EMAIL_FROM (e.g. "King Praise Web Design <hello@yourdomain.com>")
// Throws on failure so callers can report it; fire-and-forget callers use .catch().
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
      from: process.env.EMAIL_FROM || 'King Praise Web Design <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${data.message || JSON.stringify(data)}`);
  return data;
};

module.exports = sendEmail;
