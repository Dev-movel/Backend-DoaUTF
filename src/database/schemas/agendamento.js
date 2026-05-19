module.exports = `
    CREATE TABLE IF NOT EXISTS agendamento (
        id                   BIGSERIAL PRIMARY KEY,
        item_id              BIGINT NOT NULL REFERENCES item(id) ON DELETE CASCADE,
        doador_id            BIGINT NOT NULL REFERENCES pessoa(id),
        receptor_id          BIGINT NOT NULL REFERENCES pessoa(id),
        data_hora            TIMESTAMPTZ,
        status               TEXT NOT NULL DEFAULT 'pendente',
        confirmacao_doador   BOOLEAN NOT NULL DEFAULT FALSE,
        confirmacao_receptor BOOLEAN NOT NULL DEFAULT FALSE,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
`;