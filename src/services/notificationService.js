const pool = require('../config/db');

const notify = async (pessoaId, tipo, mensagem, dados = null) => {
    try {
        await pool.query(
            `INSERT INTO notificacao (pessoa_id, tipo, mensagem, dados)
             VALUES ($1, $2, $3, $4)`,
            [pessoaId, tipo, mensagem, dados ? JSON.stringify(dados) : null]
        );
    } catch (err) {
        console.error(`[notify] Erro ao salvar notificacao (pessoa ${pessoaId}):`, err.message);
    }
};

module.exports = { notify };
