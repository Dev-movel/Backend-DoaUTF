module.exports = `
CREATE TABLE IF NOT EXISTS administrador (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER UNIQUE REFERENCES pessoa(id) ON DELETE CASCADE,
  nivel VARCHAR(50) DEFAULT 'basico'
);
`;