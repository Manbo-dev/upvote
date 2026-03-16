-- Tabela de assinaturas vinculada a organizações
CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL UNIQUE REFERENCES organizations(id),
    plano                   VARCHAR(20) NOT NULL DEFAULT 'FREE',
    stripe_customer_id      VARCHAR(255),
    stripe_subscription_id  VARCHAR(255),
    stripe_status           VARCHAR(30),
    current_period_end      TIMESTAMP,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- Cria registro FREE para todas as organizações existentes
INSERT INTO subscriptions (organization_id, plano)
SELECT id, 'FREE' FROM organizations;
