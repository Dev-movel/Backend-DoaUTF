require('dotenv').config();
const pool = require('../src/config/db');

const reset = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('🗑️  Limpando tabelas...');

        await client.query('TRUNCATE mensagens_chat_leituras RESTART IDENTITY CASCADE');
        console.log('  ✓ mensagens_chat_leituras');

        await client.query('TRUNCATE mensagens_chat RESTART IDENTITY CASCADE');
        console.log('  ✓ mensagens_chat');

        await client.query('TRUNCATE avaliacao_denuncia RESTART IDENTITY CASCADE');
        console.log('  ✓ avaliacao_denuncia');

        await client.query('TRUNCATE avaliacao RESTART IDENTITY CASCADE');
        console.log('  ✓ avaliacao');

        await client.query('TRUNCATE notificacao RESTART IDENTITY CASCADE');
        console.log('  ✓ notificacao');

        await client.query('TRUNCATE agendamento RESTART IDENTITY CASCADE');
        console.log('  ✓ agendamento');

        await client.query('TRUNCATE solicitacao RESTART IDENTITY CASCADE');
        console.log('  ✓ solicitacao');

        await client.query('TRUNCATE item_imagem RESTART IDENTITY CASCADE');
        console.log('  ✓ item_imagem');

        await client.query('TRUNCATE item RESTART IDENTITY CASCADE');
        console.log('  ✓ item');

        await client.query('TRUNCATE resgates RESTART IDENTITY CASCADE');
        console.log('  ✓ resgates');

        await client.query('TRUNCATE pontos_log RESTART IDENTITY CASCADE');
        console.log('  ✓ pontos_log');

        await client.query('TRUNCATE pontos_usuario RESTART IDENTITY CASCADE');
        console.log('  ✓ pontos_usuario');

        await client.query('COMMIT');
        console.log('\n✅ Banco zerado com sucesso! Usuários preservados.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao zerar banco:', err.message);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
};

reset();
