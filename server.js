require('dotenv').config();

const app = require('./src/app');
const PORT = process.env.PORT || 3000;

const initDatabase = require('./src/database/initDatabase');
const { initTransporter } = require('./src/config/mailer');

const cron = require('node-cron');
const pool = require('./src/config/db');
const { notify } = require('./src/services/notificationService');

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
                RETURNING id, item_id, doador_id, receptor_id
            ),
            itens_atualizados AS (
                UPDATE item
                SET status = 'disponivel'
                WHERE id IN (SELECT item_id FROM agendamentos_expirados)
            )
            SELECT ae.id, ae.item_id, ae.doador_id, ae.receptor_id,
                   i.titulo as item_titulo, p_doador.nome as doador_nome, p_receptor.nome as receptor_nome
            FROM agendamentos_expirados ae
            JOIN item i ON i.id = ae.item_id
            JOIN pessoa p_doador ON p_doador.id = ae.doador_id
            JOIN pessoa p_receptor ON p_receptor.id = ae.receptor_id;
        `);

        if (result.rowCount > 0) {
            console.log(`[CRON] Sucesso: ${result.rowCount} agendamento(s) expiraram. Itens devolvidos ao feed.`);
            result.rows.forEach(row => {
                const msg = `O agendamento de ${row.item_titulo} expirou por falta de confirmação em 48h.`;
                notify(row.doador_id, 'agendamento_expirado', msg,
                    { item_id: row.item_id, agendamento_id: row.id, item_titulo: row.item_titulo, usuario_nome: row.receptor_nome });
                notify(row.receptor_id, 'agendamento_expirado', msg,
                    { item_id: row.item_id, agendamento_id: row.id, item_titulo: row.item_titulo, usuario_nome: row.doador_nome });
            });
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