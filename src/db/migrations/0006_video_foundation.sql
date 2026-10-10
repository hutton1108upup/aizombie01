CREATE TABLE video_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'done', 'failed')),
  mode TEXT NOT NULL CHECK(mode IN ('couple', 'pet')),
  quality TEXT NOT NULL CHECK(quality IN ('480p', '720p')),
  aspect TEXT NOT NULL CHECK(aspect IN ('16:9', '9:16')),
  provider_job_id TEXT UNIQUE,
  video_key TEXT,
  error TEXT,
  deleted_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, idempotency_key)
);
CREATE INDEX video_jobs_user_created_idx ON video_jobs(user_id, created_at);

-- Each paid grant expires independently; provider + order identifies a purchase.
CREATE TABLE video_credit_grants (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  order_id TEXT NOT NULL,
  pack_id TEXT NOT NULL CHECK(pack_id IN ('single', 'starter', 'creator')),
  credits INTEGER NOT NULL CHECK(credits > 0),
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(provider, order_id)
);
CREATE INDEX video_credit_grants_user_idx ON video_credit_grants(user_id, expires_at);

-- Negative debit, positive compensation. No public route can grant credits.
CREATE TABLE video_credit_entries (
  id TEXT PRIMARY KEY NOT NULL,
  grant_id TEXT NOT NULL REFERENCES video_credit_grants(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES video_jobs(id) ON DELETE NO ACTION,
  kind TEXT NOT NULL CHECK(kind IN ('debit', 'refund')),
  amount INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(grant_id, job_id, kind),
  CHECK((kind = 'debit' AND amount < 0) OR (kind = 'refund' AND amount > 0))
);
CREATE TRIGGER video_credit_entry_guard BEFORE INSERT ON video_credit_entries
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM video_credit_grants g JOIN video_jobs j ON j.id = NEW.job_id
    WHERE g.id = NEW.grant_id AND g.user_id = j.user_id
  ) THEN RAISE(ABORT, 'credit owner mismatch') END;
  SELECT CASE WHEN NEW.kind = 'debit' AND (
    (SELECT expires_at FROM video_credit_grants WHERE id = NEW.grant_id) <= NEW.created_at
    OR (SELECT credits FROM video_credit_grants WHERE id = NEW.grant_id)
       + COALESCE((SELECT SUM(amount) FROM video_credit_entries WHERE grant_id = NEW.grant_id), 0)
       + NEW.amount < 0
  ) THEN RAISE(ABORT, 'insufficient or expired credits') END;
  SELECT CASE WHEN NEW.kind = 'refund' AND NOT EXISTS (
    SELECT 1 FROM video_credit_entries e JOIN video_jobs j ON j.id = e.job_id
    WHERE e.grant_id = NEW.grant_id AND e.job_id = NEW.job_id
      AND e.kind = 'debit' AND e.amount = -NEW.amount AND j.status = 'failed'
  ) THEN RAISE(ABORT, 'invalid credit refund') END;
END;
