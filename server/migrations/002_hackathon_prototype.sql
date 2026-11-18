CREATE TABLE IF NOT EXISTS marketplace_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_user_id INTEGER,
  owner_token TEXT NOT NULL DEFAULT '',
  seller_name TEXT NOT NULL,
  category TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  unit TEXT NOT NULL,
  price_lrd INTEGER NOT NULL,
  county TEXT NOT NULL,
  town TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_demo_listing INTEGER NOT NULL DEFAULT 1,
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'flagged', 'hidden')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (seller_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_filter ON marketplace_listings (moderation_status, category, county);

CREATE TABLE IF NOT EXISTS marketplace_inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  buyer_user_id INTEGER,
  buyer_token TEXT NOT NULL DEFAULT '',
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL DEFAULT '',
  buyer_county TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Farmer Replied', 'Closed')),
  farmer_reply TEXT DEFAULT '',
  is_demo_inquiry INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS local_language_recordings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_code TEXT NOT NULL CHECK (language_code IN ('en', 'bas', 'man', 'kpe', 'lre')),
  topic_slug TEXT NOT NULL,
  topic_label TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  local_phrase_gloss TEXT NOT NULL DEFAULT '',
  audio_data_url TEXT DEFAULT '',
  speaker_name TEXT NOT NULL,
  consent_confirmed INTEGER NOT NULL DEFAULT 0,
  review_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (review_status IN ('reviewed', 'pending_review', 'needs_rerecording')),
  is_sample_demo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS demo_expert_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  requester_token TEXT NOT NULL DEFAULT '',
  farmer_name TEXT NOT NULL,
  category TEXT NOT NULL,
  county TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_data_url TEXT DEFAULT '',
  voice_note_data_url TEXT DEFAULT '',
  voice_note_summary TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Assigned', 'Answered')),
  assigned_expert_name TEXT DEFAULT 'Demo Extension Queue (Simulated)',
  expert_reply TEXT DEFAULT '',
  is_simulated_demo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
