-- Enable pg_trgm extension for trigram-based similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes on feedback_groups for fast similarity queries via pg_trgm
CREATE INDEX IF NOT EXISTS idx_feedback_groups_title_trgm
    ON feedback_groups USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_feedback_groups_summary_trgm
    ON feedback_groups USING GIN (summary gin_trgm_ops);
