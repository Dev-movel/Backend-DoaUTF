const bcrypt = require('bcrypt');
const pool = require('../config/db');

const SALT_ROUNDS = 10;

const register = async (req, res) => {
    const { nome, email, senha, data_nascimento } = req.body;

    if (!email.endsWith('@alunos.utfpr.edu.br')) {
        return res.status(400).json({ erro: 'O email deve ser do domínio @alunos.utfpr.edu.br' });
    }

    const existente = await pool.query('SELECT id FROM pessoa WHERE email = $1', [email]);
    if (existente.rowCount > 0) {
        return res.status(400).json({ erro: 'E-mail já cadastrado' });
    }

    try {
        const hash = await bcrypt.hash(senha, SALT_ROUNDS);
        const result = await pool.query(
            'INSERT INTO pessoa (nome, email, senha, data_nascimento) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, data_nascimento',
            [nome, email, hash, data_nascimento ?? null]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
    }
};

module.exports = { register };
