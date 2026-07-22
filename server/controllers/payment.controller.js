const crypto = require('crypto');
const db = require('../db/database');
const paystack = require('../utils/paystack');

function generateReference(orderId) {
  return `nm_order${orderId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

// Step 1: Initialize a Paystack transaction for a pending order.
async function initializePayment(req, res) {
  const { order_id } = req.body;
  if (!order_id) return res.status(400).json({ error: 'order_id is required.' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.status !== 'pending') {
    return res.status(400).json({ error: `Order is already ${order.status}.` });
  }

  const userRow = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.id);
  const reference = generateReference(order.id);
  const callbackUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/checkout.html?reference=${reference}`;

  try {
    const data = await paystack.initializeTransaction({
      email: userRow.email,
      amountNaira: order.total_amount,
      reference,
      callback_url: callbackUrl,
      metadata: { order_id: order.id, user_id: req.user.id },
    });

    db.prepare(`
      INSERT INTO payments (order_id, paystack_reference, amount, status)
      VALUES (?, ?, ?, 'pending')
    `).run(order.id, reference, order.total_amount);

    db.prepare('UPDATE orders SET paystack_reference = ? WHERE id = ?').run(reference, order.id);

    res.json({
      authorization_url: data.authorization_url,
      access_code: data.access_code,
      reference: data.reference,
    });
  } catch (err) {
    res.status(502).json({ error: `Paystack error: ${err.message}` });
  }
}

// Shared logic: mark a payment/order as paid and decrement inventory. Idempotent.
function finalizeSuccessfulPayment(reference, paystackData) {
  const payment = db.prepare('SELECT * FROM payments WHERE paystack_reference = ?').get(reference);
  if (!payment) return { ok: false, reason: 'Payment record not found for this reference.' };

  if (payment.status === 'success') {
    return { ok: true, alreadyProcessed: true }; // idempotent - webhook + callback may both fire
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(payment.order_id);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(payment.order_id);

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE payments SET status = 'success', channel = ?, paid_at = datetime('now') WHERE id = ?
    `).run(paystackData.channel || null, payment.id);

    db.prepare(`UPDATE orders SET status = 'paid', updated_at = datetime('now') WHERE id = ?`).run(order.id);

    const decrementStock = db.prepare(`
      UPDATE inventory SET quantity_in_stock = MAX(0, quantity_in_stock - ?), updated_at = datetime('now')
      WHERE product_id = ?
    `);
    for (const item of items) {
      decrementStock.run(item.quantity, item.product_id);
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(order.user_id);
  });

  tx();
  return { ok: true, alreadyProcessed: false };
}

function markPaymentFailed(reference) {
  db.prepare(`UPDATE payments SET status = 'failed' WHERE paystack_reference = ? AND status = 'pending'`).run(reference);
}

// Step 2: Verify a transaction (called from the checkout callback page).
async function verifyPayment(req, res) {
  const { reference } = req.params;

  try {
    const data = await paystack.verifyTransaction(reference);

    if (data.status === 'success') {
      const result = finalizeSuccessfulPayment(reference, data);
      if (!result.ok) return res.status(404).json({ error: result.reason });
      const order = db.prepare(`
        SELECT o.* FROM orders o JOIN payments p ON p.order_id = o.id WHERE p.paystack_reference = ?
      `).get(reference);
      return res.json({ status: 'success', order });
    } else {
      markPaymentFailed(reference);
      return res.json({ status: data.status, message: 'Payment was not successful.' });
    }
  } catch (err) {
    res.status(502).json({ error: `Paystack error: ${err.message}` });
  }
}

// Step 3: Paystack webhook - source of truth, works even if the user closes the browser
// before the callback page runs. Verifies the request truly came from Paystack.
function webhook(req, res) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers['x-paystack-signature'];
  const hash = crypto.createHmac('sha512', secret).update(req.rawBody || '').digest('hex');

  if (hash !== signature) {
    return res.status(401).json({ error: 'Invalid webhook signature.' });
  }

  const event = req.body;
  if (event.event === 'charge.success') {
    const reference = event.data.reference;
    finalizeSuccessfulPayment(reference, event.data);
  } else if (event.event === 'charge.failed') {
    markPaymentFailed(event.data.reference);
  }

  res.sendStatus(200);
}

module.exports = { initializePayment, verifyPayment, webhook };
