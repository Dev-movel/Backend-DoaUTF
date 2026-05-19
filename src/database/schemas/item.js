module.exports = `
CREATE TABLE IF NOT EXISTS item (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT NOT NULL,
  categoria_id INTEGER NOT NULL REFERENCES categoria(id),
  estado_conservacao VARCHAR(20) NOT NULL CHECK (estado_conservacao IN ('novo', 'usado', 'precisa_de_reparo')),
  local_retirada VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservado', 'doado')),
  pessoa_id INTEGER NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
