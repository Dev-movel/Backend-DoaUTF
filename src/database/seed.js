const pool = require('../config/db');
const bcrypt = require('bcrypt');

const seedDatabase = async () => {
  try {
    console.log('🌱 Iniciando o Seed do banco de dados...');

    const senhaPadrao = await bcrypt.hash('123456', 10);

    console.log(' Criando categorias...');
    const categorias = ['Roupas', 'Eletrônicos', 'Livros', 'Móveis', 'Outros'];
    for (const nome of categorias) {
      await pool.query(
        'INSERT INTO categoria (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING',
        [nome]
      );
    }

    console.log('Criando administrador...');
    const resAdminPessoa = await pool.query(`
      INSERT INTO pessoa (nome, email, senha, is_verified, whatsapp) 
      VALUES ($1, $2, $3, $4, $5) 
      ON CONFLICT (email) DO NOTHING
      RETURNING id`,
      ['Admin', 'admin@admin.com', senhaPadrao, true, '45999990000']
    );

    if (resAdminPessoa.rows.length > 0) {
      const adminPessoaId = resAdminPessoa.rows[0].id;
      await pool.query(
        'INSERT INTO administrador (pessoa_id, nivel) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [adminPessoaId, 'total']
      );
    }

    console.log(' Criando usuário de teste...');
    const resUserPessoa = await pool.query(`
      INSERT INTO pessoa (nome, email, senha, is_verified, whatsapp, cidade) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      ON CONFLICT (email) DO NOTHING
      RETURNING id`,
      ['Guilherme Inoe', 'guilherme@email.com', senhaPadrao, true, '45988887777', 'Toledo']
    );

    if (resUserPessoa.rows.length > 0) {
      const userPessoaId = resUserPessoa.rows[0].id;
      await pool.query(
        'INSERT INTO usuario (pessoa_id, matricula) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userPessoaId, '202400123']
      );

      console.log(' Criando item de exemplo...');
      const catRes = await pool.query("SELECT id FROM categoria WHERE nome = 'Roupas' LIMIT 1");
      const categoriaId = catRes.rows[0].id;

      await pool.query(`
        INSERT INTO item (titulo, descricao, categoria_id, estado_conservacao, local_retirada, status, pessoa_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'Casaco de Inverno', 
          'Casaco em ótimo estado, pouquíssimo usado.', 
          categoriaId, 
          'usado', 
          'Bloco B - UTFPR', 
          'disponivel', 
          userPessoaId
        ]
      );
    }

    console.log(' Banco de dados populado com sucesso!');
  } catch (error) {
    console.error(' Erro durante o Seed:', error);
  } finally {
    await pool.end();
    process.exit();
  }
};

seedDatabase();