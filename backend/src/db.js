const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/store.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH, {
      // WAL mode for better concurrent read performance
      fileMustExist: false,
    });
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
  }
  return db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'customer',
      created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id              TEXT PRIMARY KEY,
      title           TEXT NOT NULL,
      description     TEXT NOT NULL,
      price_cents     INTEGER NOT NULL,
      file_path       TEXT,
      file_name       TEXT,
      status          TEXT NOT NULL DEFAULT 'pending',
      ai_generated    INTEGER NOT NULL DEFAULT 0,
      category        TEXT DEFAULT 'ebook',
      created_at      INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      updated_at      INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id                  TEXT PRIMARY KEY,
      user_id             TEXT NOT NULL,
      product_id          TEXT NOT NULL,
      stripe_payment_id   TEXT,
      stripe_session_id   TEXT UNIQUE,
      amount_cents        INTEGER NOT NULL,
      status              TEXT NOT NULL DEFAULT 'pending',
      download_token      TEXT UNIQUE,
      download_count      INTEGER NOT NULL DEFAULT 0,
      download_limit      INTEGER NOT NULL DEFAULT 3,
      created_at          INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS ai_settings (
      id      INTEGER PRIMARY KEY DEFAULT 1,
      enabled INTEGER NOT NULL DEFAULT 1
    );

    INSERT OR IGNORE INTO ai_settings (id, enabled) VALUES (1, 1);

    CREATE TABLE IF NOT EXISTS ai_cache (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL,
      prompt_hash TEXT NOT NULL,
      result      TEXT NOT NULL,
      created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(stripe_session_id);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON ai_cache(prompt_hash);
  `);

  console.log('Database initialised at', DB_PATH);
}

module.exports = { getDb, initDb };
