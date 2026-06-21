module.exports = `
    CREATE TABLE IF NOT EXISTS notificacao (
        id        BIGSERIAL PRIMARY KEY,
        pessoa_id INTEGER NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
        tipo      VARCHAR(60) NOT NULL,
        mensagem  TEXT NOT NULL,
        dados     JSONB,
        lida      BOOLEAN NOT NULL DEFAULT FALSE,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_notificacao_pessoa_id
        ON notificacao(pessoa_id);

    CREATE INDEX IF NOT EXISTS idx_notificacao_pessoa_lida
        ON notificacao(pessoa_id, lida);
`;
