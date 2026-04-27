const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('openai');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function hashPrompt(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function isAiEnabled() {
  const row = getDb().prepare('SELECT enabled FROM ai_settings WHERE id = 1').get();
  return row?.enabled === 1;
}

async function runAI(type, prompt) {
  const db = getDb();
  const hash = hashPrompt(type + prompt);

  // Check cache (24 h)
  const cached = db.prepare(
    'SELECT result FROM ai_cache WHERE prompt_hash = ? AND type = ? AND created_at > ?'
  ).get(hash, type, Math.floor(Date.now() / 1000) - 86400);
  if (cached) return JSON.parse(cached.result);

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.7,
  });

  const content = completion.choices[0].message.content.trim();
  const id = uuidv4();
  db.prepare('INSERT INTO ai_cache (id, type, prompt_hash, result) VALUES (?, ?, ?, ?)').run(
    id, type, hash, JSON.stringify(content)
  );
  return content;
}

// POST /api/ai/generate-description — admin
router.post(
  '/generate-description',
  authMiddleware,
  adminOnly,
  aiLimiter,
  [body('topic').trim().isLength({ min: 5, max: 300 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
      if (!isAiEnabled()) return res.status(503).json({ error: 'AI generation is disabled' });

      const { topic } = req.body;
      const prompt = `Write a compelling, SEO-friendly product description for a digital ebook about: "${topic}". 
Keep it between 100-200 words. Focus on benefits and outcomes for the reader. Do not use markdown.`;

      const description = await runAI('description', prompt);
      res.json({ description });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/ai/generate-pricing — admin
router.post(
  '/generate-pricing',
  authMiddleware,
  adminOnly,
  aiLimiter,
  [
    body('topic').trim().isLength({ min: 5, max: 300 }),
    body('page_count').optional().isInt({ min: 1, max: 500 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
      if (!isAiEnabled()) return res.status(503).json({ error: 'AI generation is disabled' });

      const { topic, page_count = 50 } = req.body;
      const prompt = `Suggest a fair retail price in USD for a digital ebook titled "${topic}" with approximately ${page_count} pages.
Respond with ONLY a JSON object like: {"price_usd": 9.99, "reasoning": "brief explanation"}`;

      const raw = await runAI('pricing', prompt);
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { price_usd: 9.99, reasoning: raw };
      }
      res.json(parsed);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/ai/generate-ebook — admin (generates outline + intro, saves JSON)
router.post(
  '/generate-ebook',
  authMiddleware,
  adminOnly,
  aiLimiter,
  [
    body('title').trim().isLength({ min: 5, max: 200 }),
    body('audience').optional().trim().isLength({ max: 200 }),
    body('chapters').optional().isInt({ min: 3, max: 20 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
      if (!isAiEnabled()) return res.status(503).json({ error: 'AI generation is disabled' });

      const { title, audience = 'general readers', chapters = 5 } = req.body;
      const prompt = `Create a detailed ebook outline for a book titled "${title}" aimed at ${audience}.
Structure: table of contents with ${chapters} chapters, each with 3-4 sub-topics.
Then write the introduction (300-400 words).
Respond with JSON: {"toc": [...], "introduction": "..."}`;

      const raw = await runAI('ebook', prompt);
      let content;
      try {
        content = JSON.parse(raw);
      } catch {
        content = { toc: [], introduction: raw };
      }
      res.json({ title, content });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/ai/status — admin
router.get('/status', authMiddleware, adminOnly, (req, res) => {
  res.json({ ai_enabled: isAiEnabled() });
});

module.exports = router;
