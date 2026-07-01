module.exports = `
  CREATE TABLE IF NOT EXISTS pontos_log (
    id          SERIAL PRIMARY KEY,
    usuario_id  INT NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
    delta       INT NOT NULL,
    origem      TEXT NOT NULL,
    saldo_apos  INT NOT NULL,
    criado_em   TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_pontos_log_usuario_id ON pontos_log(usuario_id);
`;
