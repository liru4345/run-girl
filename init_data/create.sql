
-- USERS table
CREATE TABLE  IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50),
  email VARCHAR(100) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone_number VARCHAR(15) NOT NULL, --removed unique for testing
  profile_picture TEXT,
  bio TEXT,
  followers_count INTEGER ,
  following_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FRIENDS table (many-to-many relationship between users)
CREATE TABLE  IF NOT EXISTS friends (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friend FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- POSTS table (posts made by users)
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,                            -- Optional: general text or recap
  image TEXT,                              -- Run photo (stored as URL/path)
  miles NUMERIC(5, 2),                     -- e.g., 5.20 miles
  duration_seconds INTEGER,               -- Actual run duration
  location TEXT,
  visibility VARCHAR(10) DEFAULT 'private', -- 'private' or 'public'
  pace_seconds_per_mile FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- COMMENTS table (comments on posts)
CREATE TABLE  IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- LIKES table (likes on posts)
CREATE TABLE  IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_like_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_like_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_like UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_username TEXT, -- cached for convenience, optional
  profile_icon TEXT,    -- optional, link to profile image
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'general', -- e.g., 'general', 'follow_request'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS runs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,                      -- expected return time; pushed back when the runner checks in
  finished_at TIMESTAMP,                   -- when the runner actually finished
  status VARCHAR(20) DEFAULT 'in_progress'
           CHECK (status IN ('in_progress', 'overdue', 'completed')),
  last_lat DOUBLE PRECISION,               -- live location, updated from the runner's browser
  last_lng DOUBLE PRECISION,
  last_location_at TIMESTAMP,
  checkin_sent_at TIMESTAMP,               -- when the runner was texted a check-in reminder
  overdue_alert_sent_at TIMESTAMP          -- when watchers were alerted
);

-- The safety monitor scans active runs every 15 seconds
CREATE INDEX IF NOT EXISTS idx_runs_active ON runs (status, end_time);

-- Run alerts link back to the run they're about (added here because runs is created after notifications)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS run_id INTEGER REFERENCES runs(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notifications_receiver ON notifications (receiver_id, id);


CREATE TABLE IF NOT EXISTS run_watchers (
  id SERIAL PRIMARY KEY,
  run_id INTEGER REFERENCES runs(id) ON DELETE CASCADE,
  watcher_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- === SCHEDULED RUNS (planned/future runs) ===
CREATE TABLE IF NOT EXISTS scheduled_runs (
  id               SERIAL PRIMARY KEY,
  organizer_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time       TIMESTAMP NOT NULL,                 -- date + time in one column
  location         TEXT NOT NULL,
  expected_miles   NUMERIC(5,2) NOT NULL CHECK (expected_miles > 0),
  visibility       VARCHAR(10) NOT NULL DEFAULT 'private'
                     CHECK (visibility IN ('private','public')),
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Helpful indexes (month views + visibility filters are common)
CREATE INDEX IF NOT EXISTS idx_scheduled_runs_start_time
  ON scheduled_runs (start_time);

CREATE INDEX IF NOT EXISTS idx_scheduled_runs_visibility
  ON scheduled_runs (visibility);

CREATE INDEX IF NOT EXISTS idx_scheduled_runs_organizer
  ON scheduled_runs (organizer_id);

-- === ATTENDEES (friends who join a scheduled run) ===
-- For public runs, any friend can join (app enforces “friend” check).
-- For private runs, only the organizer or invited users should be allowed (app logic).
CREATE TABLE IF NOT EXISTS scheduled_run_attendees (
  id                SERIAL PRIMARY KEY,
  scheduled_run_id  INTEGER NOT NULL REFERENCES scheduled_runs(id) ON DELETE CASCADE,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            VARCHAR(12) NOT NULL DEFAULT 'going'
                      CHECK (status IN ('going','maybe','declined','invited')),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_attendee UNIQUE (scheduled_run_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sra_run ON scheduled_run_attendees (scheduled_run_id);
CREATE INDEX IF NOT EXISTS idx_sra_user ON scheduled_run_attendees (user_id);

-- Notifications about a planned run link to it (added last because scheduled_runs is created above)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS scheduled_run_id INTEGER REFERENCES scheduled_runs(id) ON DELETE CASCADE;

-- Like and comment notifications link to the post
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE;
