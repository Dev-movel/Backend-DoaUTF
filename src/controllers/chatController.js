const pool = require('../config/db');

const buscarMensagens = async (req, res) => {
    const pessoaId = req.user.sub;
    const { solicitacaoId } = req.params;

    try {
        const solicitacaoRes = await pool.query(
            `SELECT s.solicitante_pessoa_id, i.pessoa_id AS doador_id
             FROM solicitacao s
             JOIN item i ON i.id = s.item_id
             WHERE s.id = $1`,
            [solicitacaoId]
        );

        if (solicitacaoRes.rowCount === 0) {
            return res.status(404).json({ erro: 'Solicitação não encontrada.' });
        }

        const { solicitante_pessoa_id, doador_id } = solicitacaoRes.rows[0];

        if (Number(pessoaId) !== Number(solicitante_pessoa_id) && Number(pessoaId) !== Number(doador_id)) {
            return res.status(403).json({ erro: 'Acesso negado: você não participa desta solicitação.' });
        }

        const mensagensRes = await pool.query(
            `SELECT id, remetente_id, conteudo, criado_em
             FROM mensagens_chat
             WHERE solicitacao_id = $1
             ORDER BY criado_em ASC`,
            [solicitacaoId]
        );

        return res.status(200).json(mensagensRes.rows);
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        return res.status(500).json({ erro: 'Erro ao buscar mensagens.' });
    }
};

module.exports = { buscarMensagens };
