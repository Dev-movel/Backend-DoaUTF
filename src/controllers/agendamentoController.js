const pool = require('../config/db'); 

const getUsuarioLogadoId = (req) => req.user.sub || req.user.id;

const sugerirHorario = async (req, res) => {
    const { id } = req.params; 
    const { data_hora } = req.body;
    const usuarioLogadoId = getUsuarioLogadoId(req);

    if (!data_hora) {
        return res.status(400).json({ erro: 'A data e hora são obrigatórias.' });
    }

    const dataSugerida = new Date(data_hora);
    if (dataSugerida < new Date()) {
        return res.status(422).json({ erro: 'A data e hora sugeridas não podem estar no passado.' });
    }

    try {
        const agendamentoRes = await pool.query(`
            SELECT * FROM agendamento 
            WHERE item_id = $1 AND status = 'pendente'
        `, [id]);

        if (agendamentoRes.rows.length === 0) {
            return res.status(404).json({ erro: 'Nenhum agendamento pendente encontrado para este item.' });
        }

        const agendamento = agendamentoRes.rows[0];

        if (Number(agendamento.receptor_id) !== Number(usuarioLogadoId)) {
            return res.status(403).json({ erro: 'Apenas o receptor escolhido pode sugerir horários.' });
        }

        const updateRes = await pool.query(`
            UPDATE agendamento 
            SET data_hora = $1, confirmacao_receptor = TRUE, confirmacao_doador = FALSE 
            WHERE id = $2 
            RETURNING *
        `, [dataSugerida, agendamento.id]);

        return res.status(200).json({
            mensagem: 'Horário sugerido com sucesso. Aguardando confirmação do doador.',
            agendamento: updateRes.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao sugerir horário:', erro);
        return res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
};

const proporDisponibilidade = async (req, res) => {
    const { id } = req.params;
    const { data_hora } = req.body;
    const usuarioLogadoId = getUsuarioLogadoId(req);

    if (!data_hora) {
        return res.status(400).json({ erro: 'A data e hora são obrigatórias.' });
    }

    const dataSugerida = new Date(data_hora);
    if (dataSugerida < new Date()) {
        return res.status(422).json({ erro: 'A data e hora sugeridas não podem estar no passado.' });
    }

    try {
        const agendamentoRes = await pool.query(`
            SELECT * FROM agendamento 
            WHERE item_id = $1 AND status = 'pendente'
        `, [id]);

        if (agendamentoRes.rows.length === 0) {
            return res.status(404).json({ erro: 'Nenhum agendamento pendente encontrado para este item.' });
        }

        const agendamento = agendamentoRes.rows[0];

        if (Number(agendamento.doador_id) !== Number(usuarioLogadoId)) {
            return res.status(403).json({ erro: 'Apenas o doador pode definir disponibilidade.' });
        }

        const updateRes = await pool.query(`
            UPDATE agendamento 
            SET data_hora = $1, confirmacao_doador = TRUE, confirmacao_receptor = FALSE 
            WHERE id = $2 
            RETURNING *
        `, [dataSugerida, agendamento.id]);

        return res.status(200).json({
            mensagem: 'Disponibilidade definida com sucesso. Aguardando confirmação do receptor.',
            agendamento: updateRes.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao definir disponibilidade:', erro);
        return res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
};

const confirmarAgendamento = async (req, res) => {
    const { id } = req.params; 
    const usuarioLogadoId = getUsuarioLogadoId(req);

    try {
        const agendamentoRes = await pool.query(`
            SELECT * FROM agendamento 
            WHERE item_id = $1 AND status = 'pendente'
        `, [id]);

        if (agendamentoRes.rows.length === 0) {
            return res.status(404).json({ erro: 'Agendamento pendente não encontrado ou já processado.' });
        }

        const agendamento = agendamentoRes.rows[0];
        let confirmacaoDoador = agendamento.confirmacao_doador;
        let confirmacaoReceptor = agendamento.confirmacao_receptor;

        if (Number(usuarioLogadoId) === Number(agendamento.doador_id)) {
            confirmacaoDoador = true;
        } else if (Number(usuarioLogadoId) === Number(agendamento.receptor_id)) {
            confirmacaoReceptor = true;
        } else {
            return res.status(403).json({ erro: 'Você não faz parte deste agendamento.' });
        }

        const novoStatus = (confirmacaoDoador && confirmacaoReceptor) ? 'confirmado' : 'pendente';

        const updateRes = await pool.query(`
            UPDATE agendamento 
            SET confirmacao_doador = $1, confirmacao_receptor = $2, status = $3 
            WHERE id = $4 
            RETURNING *
        `, [confirmacaoDoador, confirmacaoReceptor, novoStatus, agendamento.id]);

        return res.status(200).json({
            mensagem: novoStatus === 'confirmado' ? 'Agendamento confirmado por ambas as partes!' : 'Sua confirmação foi registrada.',
            agendamento: updateRes.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao confirmar agendamento:', erro);
        return res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
};

const concluirAgendamento = async (req, res) => {
    const { id } = req.params;
    const usuarioLogadoId = getUsuarioLogadoId(req);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const agendamentoRes = await client.query(`
            SELECT * FROM agendamento 
            WHERE item_id = $1 AND status = 'confirmado'
        `, [id]);

        if (agendamentoRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ erro: 'Nenhum agendamento confirmado encontrado para este item.' });
        }

        const agendamento = agendamentoRes.rows[0];

        if (Number(agendamento.doador_id) !== Number(usuarioLogadoId)) {
            await client.query('ROLLBACK');
            return res.status(403).json({ erro: 'Apenas o doador pode marcar a entrega como concluída.' });
        }

        await client.query(`
            UPDATE agendamento SET status = 'concluido' WHERE id = $1
        `, [agendamento.id]);

        await client.query(`
            UPDATE item SET status = 'doado' WHERE id = $1
        `, [id]);

        const updatedAgendamentoRes = await client.query(
            'SELECT * FROM agendamento WHERE id = $1',
            [agendamento.id]
        );

        await client.query('COMMIT');

        return res.status(200).json({
            mensagem: 'Entrega confirmada com sucesso! O item foi marcado como doado.',
            agendamento: updatedAgendamentoRes.rows[0],
        });

    } catch (erro) {
        await client.query('ROLLBACK');
        console.error('Erro ao concluir agendamento:', erro);
        return res.status(500).json({ erro: 'Erro interno ao finalizar entrega.' });
    } finally {
        client.release();
    }
};

const obterPorItem = async (req, res) => {
    const { id } = req.params; 

    try {
        const result = await pool.query(
            'SELECT * FROM agendamento WHERE item_id = $1',
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ erro: 'Nenhum agendamento encontrado para este item.' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar agendamento:', error);
        return res.status(500).json({ erro: 'Erro interno ao buscar agendamento.' });
    }
};

const listarMeusAgendamentos = async (req, res) => {
    const userId = getUsuarioLogadoId(req);

    try {
        const result = await pool.query(
            `SELECT a.id, a.item_id, a.doador_id, a.receptor_id, a.data_hora, a.status, a.created_at,
                            i.titulo AS item_titulo
             FROM agendamento a
             JOIN item i ON i.id = a.item_id
             WHERE a.doador_id = $1 OR a.receptor_id = $1
             ORDER BY a.created_at DESC`,
            [userId]
        );

        const agendamentos = result.rows.map(row => ({
            id: row.id,
            item_id: row.item_id,
            item_titulo: row.item_titulo,
            doador_id: row.doador_id,
            receptor_id: row.receptor_id,
            data_hora: row.data_hora,
            status: row.status,
            created_at: row.created_at,
        }));

        return res.status(200).json(agendamentos);
    } catch (error) {
        console.error('Erro ao listar agendamentos do usuário:', error);
        return res.status(500).json({ erro: 'Erro interno ao listar agendamentos.' });
    }
};

module.exports = {
    sugerirHorario,
    proporDisponibilidade,
    confirmarAgendamento,
    concluirAgendamento,
    obterPorItem,
    listarMeusAgendamentos
};