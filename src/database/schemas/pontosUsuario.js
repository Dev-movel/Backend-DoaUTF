module.exports = `
  CREATE TABLE IF NOT EXISTS pontos_usuario (
    usuario_id INT PRIMARY KEY REFERENCES pessoa(id) ON DELETE CASCADE,
    saldo      INT NOT NULL DEFAULT 0 CHECK (saldo >= 0)
  );
`;
