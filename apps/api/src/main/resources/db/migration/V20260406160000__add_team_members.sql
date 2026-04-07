CREATE TABLE team_members (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_user_id    UUID         REFERENCES users(id) ON DELETE SET NULL,
    invited_email     VARCHAR(255) NOT NULL,
    role              VARCHAR(20)  NOT NULL DEFAULT 'MEMBER',
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    invite_token      VARCHAR(64)  UNIQUE,
    invite_expires_at TIMESTAMP,
    invited_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    accepted_at       TIMESTAMP,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Prevent double-invite to same email in same workspace (only when PENDING or ACTIVE)
CREATE UNIQUE INDEX uq_team_members_owner_email_active
    ON team_members(owner_id, invited_email)
    WHERE status IN ('PENDING', 'ACTIVE');

-- A user can be an ACTIVE member of at most ONE external team at a time
CREATE UNIQUE INDEX uq_team_members_one_active_per_member
    ON team_members(member_user_id)
    WHERE status = 'ACTIVE' AND member_user_id IS NOT NULL;

CREATE INDEX idx_team_members_invite_token ON team_members(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX idx_team_members_member_user_id ON team_members(member_user_id) WHERE status = 'ACTIVE';
