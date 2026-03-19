-- Adaptação da tabela subscriptions para o Stripe SDK v31
-- No SDK v31, current_period_end e price_id migraram para item level
-- (subscription.items.data[0].current_period_end / price)

-- Armazena o ID do item da assinatura no Stripe para consultas diretas
-- sem precisar fazer round-trip à API do Stripe
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS stripe_item_id VARCHAR(255);

-- Índice para facilitar lookup por item ID (útil em webhooks de item)
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_item_id ON subscriptions(stripe_item_id);

-- Adiciona status 'PAUSED' introduzido no Stripe API 2025+
-- O CHECK constraint existente (se houver) não precisa ser alterado pois
-- a coluna stripe_status é VARCHAR sem constraint de domínio
