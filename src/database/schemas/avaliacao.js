module.exports = `
    CREATE TABLE IF NOT EXISTS avaliacao (
        id           BIGSERIAL PRIMARY KEY,
        item_id      INTEGER     NOT NULL REFERENCES item(id) ON DELETE CASCADE,
        avaliador_id INTEGER     NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
        avaliado_id  INTEGER     NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
        nota         INTEGER     NOT NULL CHECK (nota >= 1 AND nota <= 5),
        comentario   VARCHAR(500),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(item_id, avaliador_id)
    );

    CREATE INDEX IF NOT EXISTS idx_avaliacao_item      ON avaliacao(item_id);
    CREATE INDEX IF NOT EXISTS idx_avaliacao_avaliador ON avaliacao(avaliador_id);
    CREATE INDEX IF NOT EXISTS idx_avaliacao_avaliado  ON avaliacao(avaliado_id);
    CREATE INDEX IF NOT EXISTS idx_avaliacao_created   ON avaliacao(created_at);
    CREATE INDEX IF NOT EXISTS idx_avaliacao_avaliado_nota ON avaliacao(avaliado_id, nota);

    CREATE TABLE IF NOT EXISTS avaliacao_denuncia (
        id             BIGSERIAL PRIMARY KEY,
        avaliacao_id   BIGINT      NOT NULL REFERENCES avaliacao(id) ON DELETE CASCADE,
        denunciante_id INTEGER     NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
        motivo         VARCHAR(255),
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(avaliacao_id, denunciante_id)
    );

    CREATE INDEX IF NOT EXISTS idx_denuncia_avaliacao   ON avaliacao_denuncia(avaliacao_id);
    CREATE INDEX IF NOT EXISTS idx_denuncia_denunciante ON avaliacao_denuncia(denunciante_id);

    CREATE OR REPLACE VIEW usuario_reputacao AS
    SELECT
        p.id,
        COUNT(a.id)::INTEGER                                         AS total_avaliacoes,
        ROUND(AVG(a.nota)::NUMERIC, 2)::FLOAT                        AS media_avaliacoes,
        COALESCE(COUNT(CASE WHEN a.nota = 5 THEN 1 END), 0)::INTEGER AS cinco_estrelas,
        COALESCE(COUNT(CASE WHEN a.nota >= 4 THEN 1 END), 0)::INTEGER AS quatro_ou_mais_estrelas
    FROM pessoa p
    LEFT JOIN avaliacao a ON a.avaliado_id = p.id
    GROUP BY p.id;
`;
