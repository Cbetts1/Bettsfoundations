const express = require('express');
const Stripe = require('stripe');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { checkoutLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

// POST /api/orders/create-session — authenticated checkout
router.post('/create-session', authMiddleware, checkoutLimiter, async (req, res, next) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(422).json({ error: 'product_id required' });

    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = ?').get(product_id, 'approved');
    if (!product) return res.status(404).json({ error: 'Product not found or unavailable' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.title,
              description: product.description.slice(0, 500),
            },
            unit_amount: product.price_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: req.user.id,
        product_id: product.id,
      },
      success_url: `${process.env.FRONTEND_URL}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/products/${product.id}?cancelled=1`,
    });

    // Create pending order
    const orderId = uuidv4();
    db.prepare(
      'INSERT INTO orders (id, user_id, product_id, stripe_session_id, amount_cents, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(orderId, req.user.id, product.id, session.id, product.price_cents, 'pending');

    res.json({ url: session.url, session_id: session.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/webhook — Stripe webhook (raw body)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const db = getDb();
    const downloadToken = uuidv4();
    db.prepare(
      'UPDATE orders SET status = ?, stripe_payment_id = ?, download_token = ? WHERE stripe_session_id = ?'
    ).run('paid', session.payment_intent, downloadToken, session.id);
  }

  res.json({ received: true });
});

// GET /api/orders/my — list authenticated user's orders
router.get('/my', authMiddleware, (req, res, next) => {
  try {
    const orders = getDb().prepare(`
      SELECT o.id, o.amount_cents, o.status, o.created_at,
             p.title, p.category
      FROM orders o
      JOIN products p ON p.id = o.product_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.id);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/success?session_id=xxx — confirm payment and return download link
router.get('/success', authMiddleware, async (req, res, next) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(422).json({ error: 'session_id required' });

    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE stripe_session_id = ? AND user_id = ?')
      .get(session_id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      order: {
        id: order.id,
        status: order.status,
        download_url: order.status === 'paid' ? `/api/delivery/${order.download_token}` : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
