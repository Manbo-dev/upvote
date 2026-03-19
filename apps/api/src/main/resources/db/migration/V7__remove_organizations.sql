-- Remove organizations table by linking canais and subscriptions directly to users

-- 1. Add user_id column to canais
ALTER TABLE canais ADD COLUMN user_id UUID REFERENCES users(id);

-- 2. Populate user_id in canais from organizations
UPDATE canais c
SET user_id = o.owner_id
FROM organizations o
WHERE c.organization_id = o.id;

-- 3. Make user_id NOT NULL now that it's populated
ALTER TABLE canais ALTER COLUMN user_id SET NOT NULL;

-- 4. Add user_id column to subscriptions
ALTER TABLE subscriptions ADD COLUMN user_id UUID UNIQUE REFERENCES users(id);

-- 5. Populate user_id in subscriptions from organizations
UPDATE subscriptions s
SET user_id = o.owner_id
FROM organizations o
WHERE s.organization_id = o.id;

-- 6. Make user_id NOT NULL now that it's populated
ALTER TABLE subscriptions ALTER COLUMN user_id SET NOT NULL;

-- 7. Drop old FK columns and constraints
ALTER TABLE canais DROP COLUMN organization_id;
ALTER TABLE subscriptions DROP COLUMN organization_id;

-- 8. Drop organizations table
DROP TABLE organizations;

-- 9. Add index on canais.user_id
CREATE INDEX idx_canais_user_id ON canais(user_id);
