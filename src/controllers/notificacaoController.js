const pool = require('../config/db');

const listarNotificacoes = async (req, res) => {
    const pessoaId = req.user.sub;
    const { apenas_nao_lidas } = req.query;

    try {
        let sql = `SELECT id, tipo, mensagem, dados, lida, criado_em
                   FROM notificacao
                   WHERE pessoa_id = $1`;
        const params = [pessoaId];

        if (apenas_nao_lidas === 'true') {
            sql += ' AND lida = FALSE';
        }

        sql += ' ORDER BY criado_em DESC LIMIT 50';

        const result = await pool.query(sql, params);
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar notificacoes:', error);
        return res.status(500).json({ erro: 'Erro ao listar notificacoes' });
    }
};

const contarNaoLidas = async (req, res) => {
    const pessoaId = req.user.sub;

    try {
        const result = await pool.query(
            'SELECT COUNT(*) AS total FROM notificacao WHERE pessoa_id = $1 AND lida = FALSE',
            [pessoaId]
        );
        return res.status(200).json({ total: Number(result.rows[0].total) });
    } catch (error) {
        console.error('Erro ao contar notificacoes nao lidas:', error);
        return res.status(500).json({ erro: 'Erro ao contar notificacoes' });
    }
};

const marcarComoLida = async (req, res) => {
    const pessoaId = req.user.sub;
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE notificacao SET lida = TRUE
             WHERE id = $1 AND pessoa_id = $2
             RETURNING id`,
            [id, pessoaId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ erro: 'Notificacao nao encontrada' });
        }

        return res.status(200).json({ mensagem: 'Notificacao marcada como lida' });
    } catch (error) {
        console.error('Erro ao marcar notificacao como lida:', error);
        return res.status(500).json({ erro: 'Erro ao atualizar notificacao' });
    }
};

const marcarTodasComoLidas = async (req, res) => {
    const pessoaId = req.user.sub;

    try {
        await pool.query(
            'UPDATE notificacao SET lida = TRUE WHERE pessoa_id = $1 AND lida = FALSE',
            [pessoaId]
        );
        return res.status(200).json({ mensagem: 'Todas as notificacoes marcadas como lidas' });
    } catch (error) {
        console.error('Erro ao marcar todas como lidas:', error);
        return res.status(500).json({ erro: 'Erro ao atualizar notificacoes' });
    }
};

module.exports = {
    listarNotificacoes,
    contarNaoLidas,
    marcarComoLida,
    marcarTodasComoLidas,
};
