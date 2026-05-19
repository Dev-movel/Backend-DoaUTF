require('dotenv').config();

const app = require('./src/app');
const PORT = process.env.PORT || 3000;

const initDatabase = require('./src/database/initDatabase');
const { initTransporter } = require('./src/config/mailer');

const cron = require('node-cron');
const pool = require('./src/config/db');

const start = async () => {
  await initDatabase();
  
  try {
    await initTransporter();
  } catch (error) {
    console.warn('⚠️  Aviso: Não foi possível inicializar o sistema de e-mail. Verifique a configuração.');
  }

  cron.schedule('0 * * * *', async () => {
    try {
        console.log('[CRON] Iniciando varredura de agendamentos expirados (48h)...');

        const result = await pool.query(`
            WITH agendamentos_expirados AS (
                UPDATE agendamento
                SET status = 'expirado'
                WHERE status = 'pendente' AND created_at <= NOW() - INTERVAL '48 hours'
                RETURNING item_id
            )
            UPDATE item
            SET status = 'disponivel' 
            WHERE id IN (SELECT item_id FROM agendamentos_expirados)
            RETURNING id;
        `);

        if (result.rowCount > 0) {
            console.log(`[CRON] Sucesso: ${result.rowCount} agendamento(s) expiraram. Itens devolvidos ao feed.`);
        } else {
            console.log('[CRON] Nenhum agendamento expirado no momento.');
        }

    } catch (erro) {
        console.error('[CRON] Erro ao executar varredura de agendamentos:', erro);
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
};

start();