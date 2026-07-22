const db = require('../db/database');

function listInventory(req, res) {
  const rows = db.prepare(`
    SELECT p.id AS product_id, p.name, p.sku, p.price,
           i.quantity_in_stock, i.low_stock_threshold, i.updated_at
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    ORDER BY p.name ASC
  `).all();
  res.json({ inventory: rows });
}

function lowStock(req, res) {
  const rows = db.prepare(`
    SELECT p.id AS product_id, p.name, p.sku,
           i.quantity_in_stock, i.low_stock_threshold
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    WHERE i.quantity_in_stock <= i.low_stock_threshold
    ORDER BY i.quantity_in_stock ASC
  `).all();
  res.json({ lowStock: rows });
}

function updateInventory(req, res) {
  // better-sqlite3 requires `null`, not `undefined`, for an omitted bound value
  const quantity_in_stock = req.body.quantity_in_stock === undefined ? null : req.body.quantity_in_stock;
  const low_stock_threshold = req.body.low_stock_threshold === undefined ? null : req.body.low_stock_threshold;
  const productId = req.params.productId;

  const existing = db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(productId);
  if (!existing) return res.status(404).json({ error: 'Inventory record not found for this product.' });

  db.prepare(`
    UPDATE inventory SET
      quantity_in_stock = COALESCE(?, quantity_in_stock),
      low_stock_threshold = COALESCE(?, low_stock_threshold),
      updated_at = datetime('now')
    WHERE product_id = ?
  `).run(quantity_in_stock, low_stock_threshold, productId);

  const updated = db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(productId);
  res.json({ inventory: updated });
}

module.exports = { listInventory, lowStock, updateInventory };
