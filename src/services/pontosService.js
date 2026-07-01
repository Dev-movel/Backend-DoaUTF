const pool = require('../config/db');

// Garante registro em pontos_usuario. Deve ser chamado dentro de uma transação.
async function ensureSaldo(client, usuarioId) {
    await client.query(
        `INSERT INTO pontos_usuario (usuario_id, saldo)
         VALUES ($1, 0)
         ON CONFLICT (usuario_id) DO NOTHING`,
        [usuarioId]
    );
}

// Aplica delta ao saldo do usuário (saldo nunca fica negativo) e registra no log.
// Deve ser chamado dentro de uma transação com o client passado.
// Retorna o novo saldo.
async function adjustPoints(client, usuarioId, delta, origem) {
    await ensureSaldo(client, usuarioId);

    const r = await client.query(
        `UPDATE pontos_usuario
         SET saldo = GREATEST(0, saldo + $1)
         WHERE usuario_id = $2
         RETURNING saldo`,
        [delta, usuarioId]
    );

    const novoSaldo = r.rows[0].saldo;

    await client.query(
        `INSERT INTO pontos_log (usuario_id, delta, origem, saldo_apos)
         VALUES ($1, $2, $3, $4)`,
        [usuarioId, delta, origem, novoSaldo]
    );

    return novoSaldo;
}

// Versão standalone (cria e faz commit de uma transação própria).
// Usar quando o chamador não tiver uma transação aberta.
async function adjustPointsStandalone(usuarioId, delta, origem) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const saldo = await adjustPoints(client, usuarioId, delta, origem);
        await client.query('COMMIT');
        return saldo;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

// Busca (ou cria) o saldo do usuário. Não requer transação aberta.
async function getSaldo(usuarioId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await ensureSaldo(client, usuarioId);
        const r = await client.query(
            'SELECT saldo FROM pontos_usuario WHERE usuario_id = $1',
            [usuarioId]
        );
        await client.query('COMMIT');
        return r.rows[0].saldo;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

const DELTA_POR_NOTA = { 1: -5, 2: 2, 3: 5, 4: 7, 5: 10 };

module.exports = { adjustPoints, adjustPointsStandalone, getSaldo, DELTA_POR_NOTA };
