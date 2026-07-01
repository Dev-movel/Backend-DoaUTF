module.exports = `
  CREATE TABLE IF NOT EXISTS mensagens_chat_leituras (
    mensagem_id INTEGER NOT NULL REFERENCES mensagens_chat(id) ON DELETE CASCADE,
    pessoa_id   INTEGER NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
    lida_em     TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (mensagem_id, pessoa_id)
  );
`;
