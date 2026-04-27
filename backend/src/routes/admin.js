const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/dashboard
router.get('/dashboard', authMiddleware, adminOnly, (req, res, next) => {
  try {
    const db = getDb();
    const totalProducts = db.prepare("SELECT COUNT(*) as c FROM products").get().c;
    const pendingProducts = db.prepare("SELECT COUNT(*) as c FROM products WHERE status = 'pending'").get().c;
    const totalOrders = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
    const paidOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'paid'").get().c;
    const revenue = db.prepare("SELECT COALESCE(SUM(amount_cents),0) as r FROM orders WHERE status = 'paid'").get().r;
    const totalUsers = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
    const aiEnabled = db.prepare("SELECT enabled FROM ai_settings WHERE id = 1").get()?.enabled === 1;

    res.json({
      totalProducts,
      pendingProducts,
      totalOrders,
      paidOrders,
      revenue_cents: revenue,
      totalUsers,
      aiEnabled,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/products — all products with status
router.get('/products', authMiddleware, adminOnly, (req, res, next) => {
  try {
    const { status } = req.query;
    const db = getDb();
    const rows = status
      ? db.prepare('SELECT * FROM products WHERE status = ? ORDER BY created_at DESC').all(status)
      : db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    res.json({ products: rows });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/products/:id/approve
router.patch('/products/:id/approve', authMiddleware, adminOnly, (req, res, next) => {
  try {
    const db = getDb();
    db.prepare("UPDATE products SET status = 'approved', updated_at = strftime('%s','now') WHERE id = ?")
      .run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/products/:id/reject
router.patch('/products/:id/reject', authMiddleware, adminOnly, (req, res, next) => {
  try {
    const db = getDb();
    db.prepare("UPDATE products SET status = 'rejected', updated_at = strftime('%s','now') WHERE id = ?")
      .run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders
router.get('/orders', authMiddleware, adminOnly, (req, res, next) => {
  try {
    const orders = getDb().prepare(`
      SELECT o.id, o.amount_cents, o.status, o.download_count, o.download_limit, o.created_at,
             u.email as user_email, p.title as product_title
      FROM orders o
      JOIN users u ON u.id = o.user_id
      JOIN products p ON p.id = o.product_id
      ORDER BY o.created_at DESC
    `).all();
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', authMiddleware, adminOnly, (req, res, next) => {
  try {
    const users = getDb().prepare('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/ai-toggle
router.patch('/ai-toggle', authMiddleware, adminOnly, (req, res, next) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') return res.status(422).json({ error: 'enabled must be boolean' });
    getDb().prepare('UPDATE ai_settings SET enabled = ? WHERE id = 1').run(enabled ? 1 : 0);
    res.json({ ai_enabled: enabled });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
