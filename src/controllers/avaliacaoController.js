const pool = require('../config/db');

const PRAZO_AVALIACAO_DIAS = 7;

const criarAvaliacao = async (req, res) => {
    const { itemId } = req.params;
    const avaliadorId = req.user.sub;
    const { nota, comentario } = req.body;

    if (typeof nota !== 'number' || nota < 1 || nota > 5 || !Number.isInteger(nota)) {
        return res.status(422).json({
            erro: 'A nota deve ser um inteiro entre 1 e 5.',
        });
    }

    if (comentario && typeof comentario !== 'string') {
        return res.status(422).json({
            erro: 'O comentário deve ser uma string.',
        });
    }
 
    if (comentario && comentario.length > 500) {
        return res.status(422).json({
            erro: 'O comentário não pode exceder 500 caracteres.',
        });
    }
 
    const comentarioTrimmed = comentario?.trim() || null;

    try {
        const itemResult = await pool.query(
            `SELECT i.id, i.status, i.pessoa_id,
                    a.receptor_id, a.created_at as agendamento_created_at
             FROM item i
             LEFT JOIN agendamento a ON a.item_id = i.id
             WHERE i.id = $1
             ORDER BY a.id DESC
             LIMIT 1`,
            [itemId]
        );

        if (itemResult.rowCount === 0) {
            return res.status(404).json({ erro: 'Item não encontrado.' });
        }
 
        const item = itemResult.rows[0];

        if (Number(item.pessoa_id) !== Number(avaliadorId) && Number(item.receptor_id) !== Number(avaliadorId)) {
            return res.status(403).json({ erro: 'Você não participa desta transação.' });
        }

        let avaliado_id;
 
        if (Number(avaliadorId) === Number(item.pessoa_id)) {
            avaliado_id = item.receptor_id;
        } else if (Number(avaliadorId) === Number(item.receptor_id)) {
            avaliado_id = item.pessoa_id;
        } else {
            return res.status(403).json({
                erro: 'Você não participa desta transação.',
            });
        }

        if (Number(avaliadorId) === Number(avaliado_id)) {
            return res.status(403).json({
                erro: 'Você não pode avaliar a si mesmo.',
            });
        }

        if (item.agendamento_created_at) {
            const agendamentoCriadoEm = new Date(item.agendamento_created_at);
            const agora = new Date();
            const diasPassados = (agora - agendamentoCriadoEm) / (1000 * 60 * 60 * 24);
 
            if (diasPassados > PRAZO_AVALIACAO_DIAS) {
                return res.status(410).json({
                    erro: `O prazo de ${PRAZO_AVALIACAO_DIAS} dias para avaliar expirou.`,
                });
            }
        }

        const duplicataResult = await pool.query(
            `SELECT id FROM avaliacao
             WHERE item_id = $1 AND avaliador_id = $2`,
            [itemId, avaliadorId]
        );
 
        if (duplicataResult.rowCount > 0) {
            return res.status(409).json({
                erro: 'Você já avaliou esta doação. A avaliação não pode ser editada.',
            });
        }
        const result = await pool.query(
            `INSERT INTO avaliacao (item_id, avaliador_id, avaliado_id, nota, comentario)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, item_id, avaliador_id, avaliado_id, nota, comentario, created_at`,
            [itemId, avaliadorId, avaliado_id, nota, comentarioTrimmed]
        );
 
        console.log(`Avaliação criada — avaliador: ${avaliadorId}, avaliado: ${avaliado_id}, nota: ${nota}`);
 
        return res.status(201).json({
            mensagem: 'Avaliação enviada com sucesso.',
            avaliacao: result.rows[0],
        });
    } catch (error) {
        console.error('Erro em criarAvaliacao:', error);
        return res.status(500).json({ erro: 'Erro ao enviar avaliação.' });
    }
};

const listarAvaliacoes = async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    try {
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM avaliacao WHERE avaliado_id = $1',
            [userId]
        );

        const total = parseInt(countResult.rows[0].count, 10);

        const result = await pool.query(`
            SELECT a.id, a.nota, a.comentario, a.created_at,
                    p.id as avaliador_id, p.nome as avaliador_nome,
                    i.id as item_id, i.titulo as item_titulo
             FROM avaliacao a
             JOIN pessoa p ON p.id = a.avaliador_id
             JOIN item i ON i.id = a.item_id
             WHERE a.avaliado_id = $1
             ORDER BY a.created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limitNum, offset]
        );

        const reputacaoResult = await pool.query(
            `SELECT total_avaliacoes, media_avaliacoes, cinco_estrelas, quatro_ou_mais_estrelas
             FROM usuario_reputacao WHERE id = $1`,
            [userId]
        );
        const reputacao = reputacaoResult.rows[0] || {
            total_avaliacoes: 0,
            media_avaliacoes: null,
            cinco_estrelas: 0,
            quatro_ou_mais_estrelas: 0,
        };
        return res.status(200).json({
            avaliacoes: result.rows,
            reputacao,
            paginacao: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Erro em listarAvaliacoesRecebidas:', error);
        return res.status(500).json({ erro: 'Erro ao buscar avaliações.' });
    }
};

const denunciarAvaliacao = async (req, res) => {
    const { avaliacaoId } = req.params;
    const denuncianteId = req.user.sub;
    const { motivo } = req.body;

    if (motivo && typeof motivo !== 'string') {
        return res.status(422).json({
            erro: 'O motivo deve ser uma string.',
        });
    }

    if (motivo && motivo.length > 255) {
        return res.status(422).json({
            erro: 'O motivo não pode exceder 255 caracteres.',
        });
    }
 
    try {
        const avaliacaoResult = await pool.query(
            'SELECT id FROM avaliacao WHERE id = $1',
            [avaliacaoId]
        );

        if (avaliacaoResult.rowCount === 0) {
            return res.status(404).json({ erro: 'Avaliação não encontrada.' });
        }

        const avaliacao = avaliacaoResult.rows[0];

        if (denuncianteId === avaliacao.avaliador_id) {
            return res.status(403).json({
                erro: 'Você não pode denunciar sua própria avaliação.',
            });
        }

        const result = await pool.query(
            `INSERT INTO avaliacao_denuncia (avaliacao_id, denunciante_id, motivo)
             VALUES ($1, $2, $3)
             RETURNING id, avaliacao_id, denunciante_id, motivo, created_at`,
            [avaliacaoId, denuncianteId, motivo?.trim() || null]
        );

        console.log(`Avaliação denunciada — avaliacaoId: ${avaliacaoId}, denuncianteId: ${denuncianteId}`);

        return res.status(201).json({
            mensagem: 'Avaliação denunciada com sucesso.',
            denuncia: result.rows[0],
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                erro: 'Você já denunciou esta avaliação.',
            });
        }
        console.error('Erro em denunciarAvaliacao:', error);
        return res.status(500).json({ erro: 'Erro ao denunciar avaliação.' });
    }
};

const minhaReputacao = async (req, res) => {
    const userId = req.user.sub;
 
    try {
        const result = await pool.query(
            `SELECT total_avaliacoes, media_avaliacoes, cinco_estrelas, quatro_ou_mais_estrelas
             FROM usuario_reputacao WHERE id = $1`,
            [userId]
        );
 
        const reputacao = result.rows[0] || {
            total_avaliacoes: 0,
            media_avaliacoes: null,
            cinco_estrelas: 0,
            quatro_ou_mais_estrelas: 0,
        };
 
        return res.status(200).json(reputacao);
    } catch (error) {
        console.error('❌ Erro em minhaReputacao:', error);
        return res.status(500).json({ erro: 'Erro ao buscar reputação.' });
    }
};
 
module.exports = {
    criarAvaliacao,
    listarAvaliacoes,
    denunciarAvaliacao,
    minhaReputacao,
};
 