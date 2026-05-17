module.exports = `
  CREATE TABLE IF NOT EXISTS solicitacao (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES item(id) ON DELETE CASCADE,
    solicitante_pessoa_id INTEGER NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'recusado')),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (item_id, solicitante_pessoa_id)
  );
`;
