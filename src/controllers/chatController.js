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

const listarConversas = async (req, res) => {
    const pessoaId = req.user.sub;

    try {
        const result = await pool.query(
            `SELECT
                s.id                                        AS solicitacao_id,
                i.id                                        AS item_id,
                i.titulo                                    AS titulo_item,
                outro.nome                                  AS nome_outro_usuario,
                ultima.conteudo                             AS ultima_mensagem,
                ultima.criado_em                            AS ultima_mensagem_em,
                s.status                                    AS status_solicitacao,
                i.status                                    AS status_item,
                CASE
                    WHEN s.status = 'recusado' OR i.status = 'doado' THEN true
                    ELSE false
                END                                         AS encerrada,
                COUNT(mc.id) FILTER (
                    WHERE mc.remetente_id != $1
                      AND NOT EXISTS (
                          SELECT 1 FROM mensagens_chat_leituras mcl
                          WHERE mcl.mensagem_id = mc.id AND mcl.pessoa_id = $1
                      )
                )                                           AS nao_lidas
             FROM solicitacao s
             JOIN item i ON i.id = s.item_id
             JOIN pessoa outro ON outro.id = CASE
                 WHEN s.solicitante_pessoa_id = $1 THEN i.pessoa_id
                 ELSE s.solicitante_pessoa_id
             END
             LEFT JOIN mensagens_chat mc ON mc.solicitacao_id = s.id
             LEFT JOIN LATERAL (
                 SELECT conteudo, criado_em FROM mensagens_chat
                 WHERE solicitacao_id = s.id
                 ORDER BY criado_em DESC LIMIT 1
             ) ultima ON TRUE
             WHERE s.solicitante_pessoa_id = $1 OR i.pessoa_id = $1
             GROUP BY s.id, i.id, outro.nome, ultima.conteudo, ultima.criado_em
             ORDER BY encerrada ASC, ultima.criado_em DESC NULLS LAST`,
            [pessoaId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar conversas:', error);
        return res.status(500).json({ erro: 'Erro ao listar conversas.' });
    }
};

const naoLidas = async (req, res) => {
    const pessoaId = req.user.sub;

    try {
        const result = await pool.query(
            `SELECT
                s.id                        AS solicitacao_id,
                $1::int                     AS meu_id,
                outro.nome                  AS nome_outro_usuario,
                i.titulo                    AS titulo_item,
                ultima.conteudo             AS ultima_mensagem
             FROM solicitacao s
             JOIN item i ON i.id = s.item_id
             -- determina quem é o "outro" participante
             JOIN pessoa outro ON outro.id = CASE
                 WHEN s.solicitante_pessoa_id = $1 THEN i.pessoa_id
                 ELSE s.solicitante_pessoa_id
             END
             -- última mensagem da conversa
             JOIN LATERAL (
                 SELECT conteudo FROM mensagens_chat
                 WHERE solicitacao_id = s.id
                 ORDER BY criado_em DESC LIMIT 1
             ) ultima ON TRUE
             -- existe pelo menos uma mensagem não lida enviada pelo outro
             WHERE (s.solicitante_pessoa_id = $1 OR i.pessoa_id = $1)
               AND EXISTS (
                   SELECT 1 FROM mensagens_chat mc
                   WHERE mc.solicitacao_id = s.id
                     AND mc.remetente_id != $1
                     AND NOT EXISTS (
                         SELECT 1 FROM mensagens_chat_leituras mcl
                         WHERE mcl.mensagem_id = mc.id AND mcl.pessoa_id = $1
                     )
               )
             ORDER BY s.id DESC`,
            [pessoaId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar conversas não lidas:', error);
        return res.status(500).json({ erro: 'Erro ao buscar conversas não lidas.' });
    }
};

const marcarComoLido = async (req, res) => {
    const pessoaId = req.user.sub;
    const { solicitacaoId } = req.params;

    try {
        // Verifica acesso
        const acesso = await pool.query(
            `SELECT s.solicitante_pessoa_id, i.pessoa_id AS doador_id
             FROM solicitacao s
             JOIN item i ON i.id = s.item_id
             WHERE s.id = $1`,
            [solicitacaoId]
        );

        if (acesso.rowCount === 0) {
            return res.status(404).json({ erro: 'Solicitação não encontrada.' });
        }

        const { solicitante_pessoa_id, doador_id } = acesso.rows[0];

        if (Number(pessoaId) !== Number(solicitante_pessoa_id) && Number(pessoaId) !== Number(doador_id)) {
            return res.status(403).json({ erro: 'Acesso negado.' });
        }

        // Insere leitura para todas as mensagens do outro que ainda não foram lidas
        await pool.query(
            `INSERT INTO mensagens_chat_leituras (mensagem_id, pessoa_id)
             SELECT mc.id, $2
             FROM mensagens_chat mc
             WHERE mc.solicitacao_id = $1
               AND mc.remetente_id != $2
               AND NOT EXISTS (
                   SELECT 1 FROM mensagens_chat_leituras mcl
                   WHERE mcl.mensagem_id = mc.id AND mcl.pessoa_id = $2
               )`,
            [solicitacaoId, pessoaId]
        );

        return res.status(204).send();
    } catch (error) {
        console.error('Erro ao marcar conversa como lida:', error);
        return res.status(500).json({ erro: 'Erro ao marcar como lido.' });
    }
};

module.exports = { buscarMensagens, listarConversas, naoLidas, marcarComoLido };
