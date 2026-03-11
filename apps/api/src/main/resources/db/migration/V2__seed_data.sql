-- Dados iniciais para desenvolvimento
-- Senha do admin: admin123 (hash BCrypt)

INSERT INTO users (id, name, email, password_hash) VALUES
('00000000-0000-0000-0000-000000000001', 'Admin', 'admin@upvote.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

INSERT INTO organizations (id, name, slug, owner_id) VALUES
('00000000-0000-0000-0000-000000000002', 'Upvote Inc', 'upvote-inc',
 '00000000-0000-0000-0000-000000000001');

INSERT INTO products (id, name, slug, organization_id) VALUES
('00000000-0000-0000-0000-000000000003', 'Produto Demo', 'produto-demo',
 '00000000-0000-0000-0000-000000000002');

INSERT INTO suggestions (id, title, description, status, product_id, author_id, vote_count) VALUES
('00000000-0000-0000-0000-000000000004', 'Adicionar modo escuro',
 'Seria ótimo ter um tema escuro para usar à noite.', 'OPEN',
 '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 1),
('00000000-0000-0000-0000-000000000005', 'Exportar relatórios em PDF',
 'Preciso exportar os dados de feedback em formato PDF para apresentações.', 'PLANNED',
 '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 0),
('00000000-0000-0000-0000-000000000006', 'Integração com Slack',
 'Notificar no Slack quando uma nova sugestão for criada.', 'OPEN',
 '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 0);

INSERT INTO votes (suggestion_id, user_id) VALUES
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001');

INSERT INTO comments (suggestion_id, author_id, content) VALUES
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
 'Concordo! Modo escuro é essencial hoje em dia.');
