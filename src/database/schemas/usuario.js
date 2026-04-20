module.exports = `
CREATE TABLE IF NOT EXISTS usuario (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER UNIQUE REFERENCES pessoa(id) ON DELETE CASCADE,
  matricula VARCHAR(50)
);
`;