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
const mensagemChat = require('./schemas/mensagemChat');
const avaliacao = require('./schemas/avaliacao');
const pontosUsuario = require('./schemas/pontosUsuario');
const resgates = require('./schemas/resgates');
const pontosLog = require('./schemas/pontosLog');
const mensagemChatLeitura = require('./schemas/mensagemChatLeitura');
const itemDenuncia = require('./schemas/item-denuncia');

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
    await pool.query(mensagemChat);
    await pool.query(avaliacao);
    await pool.query(pontosUsuario);
    await pool.query(resgates);
    await pool.query(pontosLog);
    await pool.query(mensagemChatLeitura);
    await pool.query(itemDenuncia);

    console.log('🚀 Todas as tabelas foram criadas/verificadas');

  } catch (error) {
    console.error('❌ Erro no initDatabase:', error);
  }
};

module.exports = initDatabase;