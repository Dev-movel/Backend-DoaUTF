const pool = require('../config/db');

const listarUsuarios = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar usuários' });
    }
};

const criarUsuario = async (req, res) => {
    const { nome, email } = req.body;
    try {
        const query = 'INSERT INTO usuarios (nome, email) VALUES ($1, $2) RETURNING *';
        const result = await pool.query(query, [nome, email]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar usuários' });
    }
};

module.exports = {
    listarUsuarios,
    criarUsuario
};
