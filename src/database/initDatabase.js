const pool = require('../config/db');

const pessoa = require('./schemas/pessoa');
const usuario = require('./schemas/usuario');
const administrador = require('./schemas/usuario');

const initDatabase = async () => {
  try {
    console.log('🔌 Conectando ao banco...');

    await pool.query('SELECT 1');
    console.log('✅ Banco conectado');

    console.log('📦 Criando tabelas...');

    await pool.query(pessoa);
    await pool.query(usuario);
    await pool.query(administrador);

    console.log('🚀 Todas as tabelas foram criadas/verificadas');

  } catch (error) {
    console.error('❌ Erro no initDatabase:', error.message);
  }
};

module.exports = initDatabase;