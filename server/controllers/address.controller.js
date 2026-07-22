const db = require('../db/database');

function listAddresses(req, res) {
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(req.user.id);
  res.json({ addresses });
}

function createAddress(req, res) {
  const { label, street, city, state, phone, is_default } = req.body;
  if (!street || !city || !state || !phone) {
    return res.status(400).json({ error: 'street, city, state and phone are required.' });
  }

  const tx = db.transaction(() => {
    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }
    return db.prepare(`
      INSERT INTO addresses (user_id, label, street, city, state, phone, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, label || 'Home', street, city, state, phone, is_default ? 1 : 0).lastInsertRowid;
  });

  const id = tx();
  const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);
  res.status(201).json({ address });
}

function deleteAddress(req, res) {
  const result = db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Address not found.' });
  res.json({ message: 'Address deleted.' });
}

module.exports = { listAddresses, createAddress, deleteAddress };
