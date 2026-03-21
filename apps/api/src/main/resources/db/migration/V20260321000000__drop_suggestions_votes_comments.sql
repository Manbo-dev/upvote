-- Remove public board model (suggestions, votes, comments)
-- These tables are replaced by the widget feedback flow (feedbacks + feedback_groups)

ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_suggestion_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_suggestion_id_fkey;

DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS suggestions;
