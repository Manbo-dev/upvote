-- Renomeia a tabela products para canais
ALTER TABLE products RENAME TO canais;

-- Renomeia a coluna product_id para canal_id nas tabelas que referenciam
ALTER TABLE feedbacks RENAME COLUMN product_id TO canal_id;
ALTER TABLE feedback_groups RENAME COLUMN product_id TO canal_id;
ALTER TABLE suggestions RENAME COLUMN product_id TO canal_id;

-- Renomeia os índices existentes
ALTER INDEX idx_products_organization_id RENAME TO idx_canais_organization_id;
ALTER INDEX idx_feedbacks_product_id RENAME TO idx_feedbacks_canal_id;
ALTER INDEX idx_feedback_groups_product_id RENAME TO idx_feedback_groups_canal_id;
