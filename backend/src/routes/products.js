const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, param } = require('express-validator');
const { getDb } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uuidv4()}_${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(Object.assign(new Error('Only PDF files allowed'), { status: 422 }));
    }
    cb(null, true);
  },
});

// GET /api/products  — public, approved only
router.get('/', (req, res, next) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const offset = (Math.max(1, Number(page)) - 1) * Math.min(50, Number(limit));
    const db = getDb();
    let rows;
    if (category) {
      rows = db
        .prepare('SELECT id, title, description, price_cents, category, created_at FROM products WHERE status = ? AND category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
        .all('approved', category, Number(limit), offset);
    } else {
      rows = db
        .prepare('SELECT id, title, description, price_cents, category, created_at FROM products WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
        .all('approved', Number(limit), offset);
    }
    res.json({ products: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id — public
router.get('/:id', param('id').isUUID(), (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    const product = getDb()
      .prepare('SELECT id, title, description, price_cents, category, ai_generated, created_at FROM products WHERE id = ? AND status = ?')
      .get(req.params.id, 'approved');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

// POST /api/products — admin
router.post(
  '/',
  authMiddleware,
  adminOnly,
  upload.single('file'),
  [
    body('title').trim().isLength({ min: 3, max: 200 }),
    body('description').trim().isLength({ min: 10, max: 2000 }),
    body('price_cents').isInt({ min: 0 }),
    body('category').optional().trim().isIn(['ebook', 'course', 'template', 'other']),
  ],
  (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { title, description, price_cents, category = 'ebook' } = req.body;
      const id = uuidv4();
      const filePath = req.file ? req.file.filename : null;
      const fileName = req.file ? req.file.originalname : null;

      getDb().prepare(
        'INSERT INTO products (id, title, description, price_cents, file_path, file_name, status, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(id, title, description, Number(price_cents), filePath, fileName, 'pending', category);

      res.status(201).json({ product: { id, title, description, price_cents: Number(price_cents), category, status: 'pending' } });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/products/:id — admin (update fields)
router.patch(
  '/:id',
  authMiddleware,
  adminOnly,
  [param('id').isUUID()],
  (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const allowed = ['title', 'description', 'price_cents', 'status', 'category'];
      const fields = Object.keys(req.body).filter((k) => allowed.includes(k));
      if (!fields.length) return res.status(422).json({ error: 'No valid fields provided' });

      const db = getDb();
      const setClause = fields.map((f) => `${f} = ?`).join(', ');
      const values = fields.map((f) => req.body[f]);
      db.prepare(`UPDATE products SET ${setClause}, updated_at = strftime('%s','now') WHERE id = ?`)
        .run(...values, req.params.id);

      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
      res.json({ product });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/products/:id — admin
router.delete('/:id', authMiddleware, adminOnly, param('id').isUUID(), (req, res, next) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });

    // Delete associated file
    if (product.file_path) {
      const fp = path.join(UPLOADS_DIR, product.file_path);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
