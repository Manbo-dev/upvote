-- Tabelas para o novo fluxo de feedback inteligente

-- Grupo de feedbacks (o que aparece no dashboard como padrão)
CREATE TABLE feedback_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    vote_count INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Feedback individual enviado pelo widget
CREATE TABLE feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    feedback_group_id UUID REFERENCES feedback_groups(id),
    raw_message TEXT NOT NULL,
    synthesized_message TEXT,
    follow_up_question TEXT,
    follow_up_answer TEXT,
    page_url VARCHAR(2000),
    page_title VARCHAR(500),
    trigger_type VARCHAR(50),
    last_interaction VARCHAR(500),
    device_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedbacks_product_id ON feedbacks(product_id);
CREATE INDEX idx_feedbacks_feedback_group_id ON feedbacks(feedback_group_id);
CREATE INDEX idx_feedbacks_status ON feedbacks(status);
CREATE INDEX idx_feedback_groups_product_id ON feedback_groups(product_id);
CREATE INDEX idx_feedback_groups_status ON feedback_groups(status);
