const crypto = require('crypto');
const BASE = 'https://api.paystack.co';

const call = async (path, options = {}) => {
  if (!process.env.PAYSTACK_SECRET_KEY) throw new Error('PAYSTACK_SECRET_KEY is not set');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === false) throw new Error(`Paystack: ${data.message || res.status}`);
  return data.data;
};

// amount is in major units (e.g. Naira); Paystack wants the minor unit (kobo)
const initializeTransaction = ({ email, amount, currency, reference, metadata }) =>
  call('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      currency,
      reference,
      metadata,
      ...(process.env.PAYSTACK_CALLBACK_URL ? { callback_url: process.env.PAYSTACK_CALLBACK_URL } : {}),
    }),
  });

const verifyTransaction = (reference) => call(`/transaction/verify/${encodeURIComponent(reference)}`);

const isValidSignature = (rawBody, signature) => {
  if (!rawBody || !signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = { initializeTransaction, verifyTransaction, isValidSignature };
