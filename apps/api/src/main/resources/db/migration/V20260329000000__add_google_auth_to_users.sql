-- Make password_hash nullable to support Google-only accounts (no password set)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add google_id for direct lookup on subsequent Google sign-ins
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;

CREATE INDEX idx_users_google_id ON users (google_id);
