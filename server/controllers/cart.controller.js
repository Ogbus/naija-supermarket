const db = require('../db/database');

function getCart(req, res) {
  const items = db.prepare(`
    SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.name, p.price, p.unit,
           p.image_url, COALESCE(i.quantity_in_stock, 0) AS available_stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE ci.user_id = ?
    ORDER BY ci.created_at ASC
  `).all(req.user.id);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ items, subtotal });
}

function addToCart(req, res) {
  const { product_id, quantity } = req.body;
  const qty = Number(quantity) || 1;

  if (!product_id || qty < 1) {
    return res.status(400).json({ error: 'product_id and a positive quantity are required.' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const inventory = db.prepare('SELECT quantity_in_stock FROM inventory WHERE product_id = ?').get(product_id);
  const existingItem = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
  const desiredQty = (existingItem ? existingItem.quantity : 0) + qty;

  if (inventory && desiredQty > inventory.quantity_in_stock) {
    return res.status(400).json({ error: `Only ${inventory.quantity_in_stock} of ${product.name} left in stock.` });
  }

  if (existingItem) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(desiredQty, existingItem.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(req.user.id, product_id, qty);
  }

  res.status(201).json({ message: 'Added to cart.' });
}

function updateCartItem(req, res) {
  const { quantity } = req.body;
  const qty = Number(quantity);
  const itemId = req.params.itemId;

  const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(itemId, req.user.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found.' });

  if (qty < 1) {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(itemId);
    return res.json({ message: 'Item removed from cart.' });
  }

  const inventory = db.prepare('SELECT quantity_in_stock FROM inventory WHERE product_id = ?').get(item.product_id);
  if (inventory && qty > inventory.quantity_in_stock) {
    return res.status(400).json({ error: `Only ${inventory.quantity_in_stock} left in stock.` });
  }

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(qty, itemId);
  res.json({ message: 'Cart updated.' });
}

function removeCartItem(req, res) {
  const result = db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.itemId, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Cart item not found.' });
  res.json({ message: 'Item removed from cart.' });
}

function clearCart(req, res) {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Cart cleared.' });
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
