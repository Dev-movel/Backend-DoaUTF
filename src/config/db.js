const { Pool } = require('pg');

const pool = new Pool({
    user: 'admin',
    host: 'localhost',
    database: 'teste',
    password: 'admin',
    port: 5432,
});

const initDatabase = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL
        );
    `;
    
    try {
        await pool.query(query);
        console.log('📦 Banco de dados inicializado: Tabela "usuarios" verificada/criada.');
    } catch (error) {
        console.error('❌ Erro ao inicializar o banco de dados:', error);
    }
};

initDatabase();

module.exports = pool;