module.exports = `
CREATE TABLE IF NOT EXISTS refresh_token (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  expiracao TIMESTAMP NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pessoa
    FOREIGN KEY (pessoa_id)
    REFERENCES pessoa(id)
    ON DELETE CASCADE
);
`;