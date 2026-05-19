const pool = require('../config/db');

const criarSolicitacao = async (req, res) => {
    const pessoaId = req.user.sub;
    const { item_id } = req.body;

    if (!item_id) {
        return res.status(400).json({ erro: 'Campo obrigatório ausente: item_id' });
    }

    try {
        const itemResult = await pool.query(
            'SELECT id, pessoa_id, status FROM item WHERE id = $1',
            [item_id]
        );

        if (itemResult.rowCount === 0) {
            return res.status(404).json({ erro: 'Item não encontrado' });
        }

        const item = itemResult.rows[0];

        if (item.pessoa_id === pessoaId) {
            return res.status(403).json({ erro: 'Você não pode solicitar um item que você mesmo postou' });
        }

        if (item.status !== 'disponivel') {
            return res.status(400).json({ erro: 'Este item não está disponível para solicitação' });
        }

        const result = await pool.query(
            `INSERT INTO solicitacao (item_id, solicitante_pessoa_id)
             VALUES ($1, $2)
             RETURNING id, item_id, status, criado_em`,
            [item_id, pessoaId]
        );

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ erro: 'Você já fez uma solicitação para este item' });
        }
        console.error('Erro ao criar solicitação:', error);
        res.status(500).json({ erro: 'Erro ao criar solicitação' });
    }
};

const minhasSolicitacoes = async (req, res) => {
    const pessoaId = req.user.sub;

    try {
        const result = await pool.query(
            `SELECT
                s.id,
                s.status,
                s.criado_em,
                i.id AS item_id,
                i.titulo AS item_titulo,
                i.local_retirada AS item_local_retirada,
                c.nome AS categoria_nome,
                p.nome AS doador_nome
             FROM solicitacao s
             JOIN item i ON i.id = s.item_id
             JOIN categoria c ON c.id = i.categoria_id
             JOIN pessoa p ON p.id = i.pessoa_id
             WHERE s.solicitante_pessoa_id = $1
             ORDER BY s.criado_em DESC`,
            [pessoaId]
        );

        const solicitacoes = result.rows.map((row) => ({
            id: row.id,
            status: row.status,
            criado_em: row.criado_em,
            item: {
                id: row.item_id,
                titulo: row.item_titulo,
                local_retirada: row.item_local_retirada,
                categoria: { nome: row.categoria_nome },
                doador: { nome: row.doador_nome },
            },
        }));

        return res.status(200).json(solicitacoes);
    } catch (error) {
        console.error('Erro ao listar solicitações:', error);
        res.status(500).json({ erro: 'Erro ao listar solicitações' });
    }
};

const solicitacoesDoItem = async (req, res) => {
    const pessoaId = req.user.sub;
    const { id } = req.params;

    try {
        const itemResult = await pool.query(
            'SELECT id, pessoa_id FROM item WHERE id = $1',
            [id]
        );

        if (itemResult.rowCount === 0) {
            return res.status(404).json({ erro: 'Item não encontrado' });
        }

        if (itemResult.rows[0].pessoa_id !== pessoaId) {
            return res.status(403).json({ erro: 'Acesso negado: você não é o dono deste item' });
        }

        const result = await pool.query(
            `SELECT
                s.id,
                s.status,
                s.criado_em,
                p.nome AS solicitante_nome,
                p.whatsapp AS solicitante_whatsapp
             FROM solicitacao s
             JOIN pessoa p ON p.id = s.solicitante_pessoa_id
             WHERE s.item_id = $1
             ORDER BY s.criado_em DESC`,
            [id]
        );

        const solicitacoes = result.rows.map((row) => ({
            id: row.id,
            status: row.status,
            criado_em: row.criado_em,
            solicitante: {
                nome: row.solicitante_nome,
                whatsapp: row.solicitante_whatsapp,
            },
        }));

        return res.status(200).json(solicitacoes);
    } catch (error) {
        console.error('Erro ao listar solicitações do item:', error);
        res.status(500).json({ erro: 'Erro ao listar solicitações do item' });
    }
};

const cancelarSolicitacao = async (req, res) => {
    const pessoaId = req.user.sub;
    const { id } = req.params;

    try {
        const result = await pool.query(
            'SELECT id, solicitante_pessoa_id, status FROM solicitacao WHERE id = $1',
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ erro: 'Solicitação não encontrada' });
        }

        const solicitacao = result.rows[0];

        if (solicitacao.solicitante_pessoa_id !== pessoaId) {
            return res.status(403).json({ erro: 'Acesso negado: você não é o dono desta solicitação' });
        }

        if (solicitacao.status !== 'pendente') {
            return res.status(400).json({ erro: 'Só é possível cancelar solicitações com status pendente' });
        }

        await pool.query('DELETE FROM solicitacao WHERE id = $1', [id]);

        return res.status(200).json({ mensagem: 'Solicitação cancelada com sucesso' });
    } catch (error) {
        console.error('Erro ao cancelar solicitação:', error);
        res.status(500).json({ erro: 'Erro ao cancelar solicitação' });
    }
};

module.exports = { criarSolicitacao, minhasSolicitacoes, solicitacoesDoItem, cancelarSolicitacao };
