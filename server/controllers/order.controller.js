const db = require('../db/database');

// Create a pending order from the user's current cart.
// This does NOT touch inventory yet - stock is only decremented once payment succeeds.
function createOrder(req, res) {
  const { address_id } = req.body;
  if (!address_id) {
    return res.status(400).json({ error: 'address_id is required.' });
  }

  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(address_id, req.user.id);
  if (!address) return res.status(404).json({ error: 'Address not found.' });

  const cartItems = db.prepare(`
    SELECT ci.quantity, p.id AS product_id, p.name, p.price,
           COALESCE(i.quantity_in_stock, 0) AS available_stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE ci.user_id = ?
  `).all(req.user.id);

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  for (const item of cartItems) {
    if (item.quantity > item.available_stock) {
      return res.status(400).json({ error: `${item.name} only has ${item.available_stock} left in stock.` });
    }
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const insertOrder = db.prepare(`
    INSERT INTO orders (user_id, address_id, status, total_amount)
    VALUES (?, ?, 'pending', ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
    VALUES (?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    const result = insertOrder.run(req.user.id, address_id, totalAmount);
    const orderId = result.lastInsertRowid;
    for (const item of cartItems) {
      insertItem.run(orderId, item.product_id, item.name, item.quantity, item.price);
    }
    return orderId;
  });

  const orderId = tx();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  res.status(201).json({ order, items });
}

function getMyOrders(req, res) {
  const orders = db.prepare(`
    SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user.id);
  res.json({ orders });
}

function getOrder(req, res) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  // Customers can only view their own orders; admins can view any
  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to view this order.' });
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(order.id);
  res.json({ order, items, payment });
}

// --- Admin ---

function listAllOrders(req, res) {
  const { status } = req.query;
  let query = `
    SELECT o.*, u.name AS customer_name, u.email AS customer_email
    FROM orders o JOIN users u ON u.id = o.user_id
  `;
  const params = [];
  if (status) {
    query += ' WHERE o.status = ?';
    params.push(status);
  }
  query += ' ORDER BY o.created_at DESC';

  const orders = db.prepare(query).all(...params);
  res.json({ orders });
}

function updateOrderStatus(req, res) {
  const { status } = req.body;
  const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  db.prepare(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json({ order: updated });
}

module.exports = { createOrder, getMyOrders, getOrder, listAllOrders, updateOrderStatus };
