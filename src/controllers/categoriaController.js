const pool = require('../config/db');

const listarCategorias = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nome FROM categoria ORDER BY nome ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.status(500).json({ erro: 'Erro ao listar categorias' });
    }
};

const buscarCategoria = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT id, nome FROM categoria WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ erro: 'Categoria não encontrada' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar categoria:', error);
        res.status(500).json({ erro: 'Erro ao buscar categoria' });
    }
};

const criarCategoria = async (req, res) => {
    const { nome } = req.body;

    if (!nome || !nome.trim()) {
        return res.status(400).json({ erro: 'O campo nome é obrigatório' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO categoria (nome) VALUES ($1) RETURNING id, nome',
            [nome.trim()]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ erro: 'Já existe uma categoria com este nome' });
        }
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ erro: 'Erro ao criar categoria' });
    }
};

const atualizarCategoria = async (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;

    if (!nome || !nome.trim()) {
        return res.status(400).json({ erro: 'O campo nome é obrigatório' });
    }

    try {
        const result = await pool.query(
            'UPDATE categoria SET nome = $1 WHERE id = $2 RETURNING id, nome',
            [nome.trim(), id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ erro: 'Categoria não encontrada' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ erro: 'Já existe uma categoria com este nome' });
        }
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ erro: 'Erro ao atualizar categoria' });
    }
};

const removerCategoria = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM categoria WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ erro: 'Categoria não encontrada' });
        }
        res.status(200).json({ mensagem: 'Categoria removida com sucesso' });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ erro: 'Não é possível remover: existem itens vinculados a esta categoria' });
        }
        console.error('Erro ao remover categoria:', error);
        res.status(500).json({ erro: 'Erro ao remover categoria' });
    }
};

module.exports = { listarCategorias, buscarCategoria, criarCategoria, atualizarCategoria, removerCategoria };