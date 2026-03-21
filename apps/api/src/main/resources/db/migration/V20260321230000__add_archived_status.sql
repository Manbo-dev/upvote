-- Add ARCHIVED as a valid feedback group status.
-- No schema change needed — status is stored as VARCHAR and mapped by JPA enum.
-- This migration exists as documentation and to keep Flyway history consistent.

-- Add index to speed up filtering archived groups out of similarity searches
CREATE INDEX IF NOT EXISTS idx_feedback_groups_status ON feedback_groups (status);
