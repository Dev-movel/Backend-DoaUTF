const pool = require('../config/db');

const pessoa = require('./schemas/pessoa');
const usuario = require('./schemas/usuario');
const administrador = require('./schemas/administrador');
const refreshToken = require('./schemas/refreshToken');
const categoria = require('./schemas/categoria');
const item = require('./schemas/item');
const itemImagem = require('./schemas/itemImagem');
const solicitacao = require('./schemas/solicitacao');
const agendamento = require('./schemas/agendamento');
const agendamentoTrigger = require('./schemas/agendamentoTrigger');
const notificacao = require('./schemas/notificacao');

const initDatabase = async () => {
  try {
    console.log('🔌 Conectando ao banco...');

    await pool.query('SELECT 1');
    console.log('✅ Banco conectado');

    console.log('📦 Criando tabelas...');

    await pool.query(pessoa);
    await pool.query(usuario);
    await pool.query(administrador);
    await pool.query(refreshToken);
    await pool.query(categoria);
    await pool.query(item);
    await pool.query(itemImagem);
    await pool.query(solicitacao);
    await pool.query(agendamento);
    await pool.query(agendamentoTrigger);
    await pool.query(notificacao);

    console.log('🚀 Todas as tabelas foram criadas/verificadas');

  } catch (error) {
    console.error('❌ Erro no initDatabase:', error);
  }
};

module.exports = initDatabase;