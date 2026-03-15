-- Adiciona coluna api_key na tabela products para identificacao pelo widget
ALTER TABLE products ADD COLUMN api_key VARCHAR(52) UNIQUE;

-- Gera chave para produtos existentes
UPDATE products SET api_key = 'upv_' || encode(gen_random_bytes(24), 'hex') WHERE api_key IS NULL;

-- Torna NOT NULL apos preencher dados existentes
ALTER TABLE products ALTER COLUMN api_key SET NOT NULL;

-- Indice para busca rapida pelo widget
CREATE INDEX idx_products_api_key ON products(api_key);
