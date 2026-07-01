module.exports = `
  CREATE TABLE IF NOT EXISTS resgates (
    id            SERIAL PRIMARY KEY,
    usuario_id    INT NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
    premio_id     INT NOT NULL,
    premio_nome   TEXT NOT NULL,
    pontos_gastos INT NOT NULL,
    codigo        TEXT NOT NULL UNIQUE,
    status        TEXT NOT NULL DEFAULT 'pendente',
    criado_em     TIMESTAMPTZ DEFAULT NOW()
  );
`;
