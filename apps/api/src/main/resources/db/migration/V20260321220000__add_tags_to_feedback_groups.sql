-- Add tags column to feedback_groups for tag-based similarity matching
-- Tags are stored as a comma-separated string (e.g. 'icone,desalinhado,computador')
ALTER TABLE feedback_groups ADD COLUMN IF NOT EXISTS tags TEXT;
