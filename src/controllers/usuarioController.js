const bcrypt = require('bcrypt');
const pool = require('../config/db');

const SALT_ROUNDS = 10;

const listarUsuarios = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nome, email, data_nascimento FROM pessoa ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar usuários' });
    }
};

const atualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nome, email, senha, data_nascimento } = req.body;

    if (email && !email.endsWith('@alunos.utfpr.edu.br')) {
        return res.status(400).json({ erro: 'O email deve ser do domínio @alunos.utfpr.edu.br' });
    }

    try {
        const { rows } = await pool.query('SELECT * FROM pessoa WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });

        const atual = rows[0];
        const novoNome           = nome           ?? atual.nome;
        const novoEmail          = email          ?? atual.email;
        const novaSenha          = senha          ? await bcrypt.hash(senha, SALT_ROUNDS) : atual.senha;
        const novaDataNascimento = data_nascimento !== undefined ? data_nascimento : atual.data_nascimento;

        const result = await pool.query(
            'UPDATE pessoa SET nome = $1, email = $2, senha = $3, data_nascimento = $4 WHERE id = $5 RETURNING id, nome, email, data_nascimento',
            [novoNome, novoEmail, novaSenha, novaDataNascimento, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao atualizar usuário' });
    }
};

module.exports = { listarUsuarios, atualizarUsuario };
