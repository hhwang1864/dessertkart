CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  money INTEGER DEFAULT 0,
  owned_carts TEXT DEFAULT '["default"]',
  equipped_cart TEXT DEFAULT 'default',
  created_at TEXT DEFAULT (datetime('now'))
);
