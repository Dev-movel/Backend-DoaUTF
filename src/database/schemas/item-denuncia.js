module.exports = `
CREATE TABLE IF NOT EXISTS item_denuncia (
    id SERIAL PRIMARY KEY,
    item_id INT NOT NULL REFERENCES item(id) ON DELETE CASCADE,
    denunciante_pessoa_id INT NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
    motivo VARCHAR(100) NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;