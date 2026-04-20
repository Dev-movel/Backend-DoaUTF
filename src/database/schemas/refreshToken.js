module.exports = `
CREATE TABLE IF NOT EXISTS refresh_token (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pessoa
    FOREIGN KEY (pessoa_id)
    REFERENCES pessoa(id)
    ON DELETE CASCADE
);
`;