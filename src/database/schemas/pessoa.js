module.exports = `
CREATE TABLE IF NOT EXISTS pessoa (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  data_nascimento DATE,
  whatsapp VARCHAR(20),
  rua VARCHAR(100),
  numero VARCHAR(10),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  bloqueado BOOLEAN DEFAULT false,
  denunciado BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;