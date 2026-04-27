const express = require('express');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db');

const router = express.Router();
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');

// GET /api/delivery/:token — secure one-time-ish file delivery
router.get('/:token', (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const db = getDb();
    const order = db.prepare(`
      SELECT o.*, p.file_path, p.file_name
      FROM orders o
      JOIN products p ON p.id = o.product_id
      WHERE o.download_token = ?
    `).get(token);

    if (!order) return res.status(404).json({ error: 'Download link not found' });
    if (order.status !== 'paid') return res.status(403).json({ error: 'Payment not confirmed' });
    if (order.download_count >= order.download_limit) {
      return res.status(403).json({ error: 'Download limit reached. Contact support.' });
    }
    if (!order.file_path) return res.status(404).json({ error: 'File not available' });

    const filePath = path.join(UPLOADS_DIR, order.file_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server' });

    // Increment download counter
    db.prepare('UPDATE orders SET download_count = download_count + 1 WHERE id = ?').run(order.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${order.file_name || 'download.pdf'}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
