const bcrypt = require('bcrypt');
const pool = require('../config/db');

const SALT_ROUNDS = 10;

const register = async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!email.endsWith('@alunos.utfpr.edu.br')) {
        return res.status(400).json({ erro: 'O email deve ser do domínio @alunos.utfpr.edu.br' });
    }

    const existente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existente.rowCount > 0) {
        return res.status(400).json({ erro: 'E-mail já cadastrado' });
    }

    try {
        const hash = await bcrypt.hash(senha, SALT_ROUNDS);
        const result = await pool.query(
            'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
            [nome, email, hash]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
    }
};

module.exports = { register };
