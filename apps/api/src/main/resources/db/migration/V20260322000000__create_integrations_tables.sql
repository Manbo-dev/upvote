-- Integration tables for Jira / ClickUp external issue tracking
-- Stores OAuth credentials per user and links feedback groups to external issues

CREATE TABLE IF NOT EXISTS integrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        VARCHAR(20) NOT NULL,  -- JIRA, CLICKUP
    access_token    TEXT NOT NULL,
    refresh_token   TEXT,
    token_expiry    TIMESTAMP,
    site_url        TEXT,       -- e.g. https://mycompany.atlassian.net
    cloud_id        TEXT,       -- Jira cloud ID (required for API calls)
    team_id         TEXT,       -- ClickUp team ID
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT uq_integration_user_provider UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS external_issues (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_group_id   UUID NOT NULL REFERENCES feedback_groups(id) ON DELETE CASCADE,
    integration_id      UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    external_id         TEXT NOT NULL,      -- e.g. "PROJ-42" or ClickUp task ID
    external_url        TEXT NOT NULL,      -- direct link to the issue
    external_status     TEXT,               -- last known status from provider
    provider            VARCHAR(20) NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT uq_external_issue_group_provider UNIQUE (feedback_group_id, provider)
);

CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_external_issues_feedback_group_id ON external_issues(feedback_group_id);
CREATE INDEX idx_external_issues_external_id ON external_issues(external_id);
