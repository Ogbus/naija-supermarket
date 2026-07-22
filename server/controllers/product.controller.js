const db = require('../db/database');

function listProducts(req, res) {
  const { category, search } = req.query;
  let query = `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug,
           COALESCE(i.quantity_in_stock, 0) AS quantity_in_stock,
           COALESCE(ROUND((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), 1), 0) AS average_rating,
           (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) AS review_count
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE p.is_active = 1
  `;
  const params = [];

  if (category) {
    query += ' AND c.slug = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND p.name LIKE ?';
    params.push(`%${search}%`);
  }
  query += ' ORDER BY p.name ASC';

  const products = db.prepare(query).all(...params);
  res.json({ products });
}

function getProduct(req, res) {
  const product = db.prepare(`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug,
           COALESCE(i.quantity_in_stock, 0) AS quantity_in_stock,
           COALESCE(ROUND((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), 1), 0) AS average_rating,
           (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) AS review_count
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product });
}

function listCategories(req, res) {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  res.json({ categories });
}

// --- Admin ---

function createProduct(req, res) {
  const { name, category_id, description, price, unit, sku, image_url, initial_stock } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ error: 'name and price are required.' });
  }

  const insertProduct = db.prepare(`
    INSERT INTO products (name, category_id, description, price, unit, sku, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertInventory = db.prepare(`
    INSERT INTO inventory (product_id, quantity_in_stock, low_stock_threshold)
    VALUES (?, ?, 10)
  `);

  const tx = db.transaction(() => {
    const result = insertProduct.run(
      name, category_id || null, description || null, price, unit || 'unit', sku || null, image_url || '/images/placeholder.svg'
    );
    insertInventory.run(result.lastInsertRowid, initial_stock || 0);
    return result.lastInsertRowid;
  });

  const id = tx();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.status(201).json({ product });
}

function updateProduct(req, res) {
  // better-sqlite3 throws if a bound param is `undefined` (it requires `null`
  // for "no value"), so normalize any missing/omitted fields here.
  const nz = (v) => (v === undefined ? null : v);
  const name = nz(req.body.name);
  const category_id = nz(req.body.category_id);
  const description = nz(req.body.description);
  const price = nz(req.body.price);
  const unit = nz(req.body.unit);
  const sku = nz(req.body.sku);
  const image_url = nz(req.body.image_url);
  const is_active = nz(req.body.is_active);

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found.' });

  db.prepare(`
    UPDATE products SET
      name = COALESCE(?, name),
      category_id = COALESCE(?, category_id),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      unit = COALESCE(?, unit),
      sku = COALESCE(?, sku),
      image_url = COALESCE(?, image_url),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(name, category_id, description, price, unit, sku, image_url, is_active, req.params.id);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json({ product });
}

function deleteProduct(req, res) {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found.' });

  // Soft delete to preserve order history integrity
  db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Product deactivated.' });
}

function uploadProductImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file was uploaded.' });
  }
  const imageUrl = `/images/products/${req.file.filename}`;

  // If a product_id was supplied, attach the image to that product immediately
  if (req.body.product_id) {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.body.product_id);
    if (existing) {
      db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(imageUrl, req.body.product_id);
    }
  }

  res.status(201).json({ image_url: imageUrl });
}

module.exports = {
  listProducts,
  getProduct,
  listCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
};
