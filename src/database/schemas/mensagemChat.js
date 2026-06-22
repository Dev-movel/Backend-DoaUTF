module.exports = `
  CREATE TABLE IF NOT EXISTS mensagens_chat (
    id SERIAL PRIMARY KEY,
    solicitacao_id INTEGER NOT NULL REFERENCES solicitacao(id) ON DELETE CASCADE,
    remetente_id INTEGER NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;
