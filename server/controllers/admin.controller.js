const db = require('../db/database');

function dashboard(req, res) {
  const totalRevenue = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status != 'pending' AND status != 'cancelled'
  `).get().total;

  const totalOrders = db.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
  const pendingOrders = db.prepare(`SELECT COUNT(*) AS count FROM orders WHERE status = 'paid' OR status = 'processing'`).get().count;
  const totalCustomers = db.prepare(`SELECT COUNT(*) AS count FROM users WHERE role = 'customer'`).get().count;
  const totalProducts = db.prepare('SELECT COUNT(*) AS count FROM products WHERE is_active = 1').get().count;

  const lowStockCount = db.prepare(`
    SELECT COUNT(*) AS count FROM inventory WHERE quantity_in_stock <= low_stock_threshold
  `).get().count;

  const recentOrders = db.prepare(`
    SELECT o.id, o.total_amount, o.status, o.created_at, u.name AS customer_name
    FROM orders o JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC LIMIT 10
  `).all();

  const topProducts = db.prepare(`
    SELECT p.name, SUM(oi.quantity) AS total_sold
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'pending' AND o.status != 'cancelled'
    GROUP BY p.id
    ORDER BY total_sold DESC
    LIMIT 5
  `).all();

  res.json({
    totalRevenue,
    totalOrders,
    pendingOrders,
    totalCustomers,
    totalProducts,
    lowStockCount,
    recentOrders,
    topProducts,
  });
}

function listUsers(req, res) {
  const users = db.prepare(`
    SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC
  `).all();
  res.json({ users });
}

module.exports = { dashboard, listUsers };
