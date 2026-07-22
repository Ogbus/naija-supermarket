const db = require('../db/database');

function getRatingSummary(productId) {
  const row = db.prepare(`
    SELECT ROUND(AVG(rating), 1) AS average_rating, COUNT(*) AS review_count
    FROM reviews WHERE product_id = ?
  `).get(productId);
  return {
    average_rating: row.average_rating || 0,
    review_count: row.review_count || 0,
  };
}

function hasPurchased(userId, productId) {
  const row = db.prepare(`
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = ? AND oi.product_id = ? AND o.status != 'pending' AND o.status != 'cancelled'
    LIMIT 1
  `).get(userId, productId);
  return !!row;
}

function listReviews(req, res) {
  const productId = req.params.id;
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const reviews = db.prepare(`
    SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at, r.user_id,
           u.name AS reviewer_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `).all(productId);

  // Flag which reviews came from a customer who actually bought the product
  const withVerified = reviews.map(r => ({ ...r, verified_purchase: hasPurchased(r.user_id, productId) }));

  res.json({ reviews: withVerified, ...getRatingSummary(productId) });
}

function upsertReview(req, res) {
  const productId = req.params.id;
  const { rating, comment } = req.body;

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  db.prepare(`
    INSERT INTO reviews (product_id, user_id, rating, comment)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(product_id, user_id) DO UPDATE SET
      rating = excluded.rating,
      comment = excluded.comment,
      updated_at = datetime('now')
  `).run(productId, req.user.id, rating, comment || null);

  const review = db.prepare(`
    SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at, r.user_id, u.name AS reviewer_name
    FROM reviews r JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ? AND r.user_id = ?
  `).get(productId, req.user.id);

  res.status(201).json({
    review: { ...review, verified_purchase: hasPurchased(req.user.id, productId) },
    ...getRatingSummary(productId),
  });
}

function deleteReview(req, res) {
  const { id: productId, reviewId } = req.params;
  const review = db.prepare('SELECT * FROM reviews WHERE id = ? AND product_id = ?').get(reviewId, productId);
  if (!review) return res.status(404).json({ error: 'Review not found.' });

  if (req.user.role !== 'admin' && review.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own review.' });
  }

  db.prepare('DELETE FROM reviews WHERE id = ?').run(reviewId);
  res.json({ message: 'Review deleted.', ...getRatingSummary(productId) });
}

module.exports = { listReviews, upsertReview, deleteReview };
