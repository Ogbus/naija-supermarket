// Thin wrapper around the Paystack REST API.
// Docs: https://paystack.com/docs/api/transaction/
const fetch = require('node-fetch');

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is not set in environment variables');
  }
  return key;
}

/**
 * Initialize a Paystack transaction.
 * amount must be passed in Naira; Paystack expects kobo (amount * 100).
 */
async function initializeTransaction({ email, amountNaira, reference, callback_url, metadata }) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amountNaira * 100),
      reference,
      callback_url,
      metadata,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || 'Failed to initialize Paystack transaction');
  }
  return data.data; // { authorization_url, access_code, reference }
}

/**
 * Verify a Paystack transaction by reference.
 */
async function verifyTransaction(reference) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
    },
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || 'Failed to verify Paystack transaction');
  }
  return data.data; // { status: 'success'|'failed'|..., amount, channel, ... }
}

module.exports = { initializeTransaction, verifyTransaction };
