const pool = require('../config/db');

const pessoa = require('./schemas/pessoa');
const usuario = require('./schemas/usuario');
const administrador = require('./schemas/administrador');
const refreshToken = require('./schemas/refreshToken');
const categoria = require('./schemas/categoria');
const item = require('./schemas/item');
const itemImagem = require('./schemas/itemImagem');
const solicitacao = require('./schemas/solicitacao');

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

    console.log('🚀 Todas as tabelas foram criadas/verificadas');

  } catch (error) {
    console.error('❌ Erro no initDatabase:', error);
  }
};

module.exports = initDatabase;