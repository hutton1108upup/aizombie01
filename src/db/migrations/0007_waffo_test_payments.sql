-- Sandbox purchases never enter video_credit_grants or the real payment table.
CREATE TABLE aizombie_test_checkouts (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  pack_id TEXT NOT NULL CHECK(pack_id IN ('single', 'starter', 'creator')),
  product_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount > 0),
  credits INTEGER NOT NULL CHECK(credits > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'refunded')),
  order_id TEXT UNIQUE,
  session_url TEXT,
  session_expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, request_id)
);
CREATE INDEX aizombie_test_checkouts_user_idx ON aizombie_test_checkouts(user_id, created_at);
-- Preserve a refund received before order.completed; late completion cannot regrant.
CREATE TRIGGER aizombie_test_refund_guard BEFORE UPDATE OF status ON aizombie_test_checkouts
WHEN OLD.status = 'refunded' AND NEW.status <> 'refunded'
BEGIN
  SELECT RAISE(ABORT, 'refunded test purchase cannot be restored');
END;
