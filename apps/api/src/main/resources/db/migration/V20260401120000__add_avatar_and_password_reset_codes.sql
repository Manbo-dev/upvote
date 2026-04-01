ALTER TABLE users ADD COLUMN avatar TEXT;

CREATE TABLE password_reset_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  type VARCHAR(30) NOT NULL,
  new_password_hash TEXT,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_prc_user_id ON password_reset_codes(user_id);
CREATE INDEX idx_prc_code ON password_reset_codes(code);
