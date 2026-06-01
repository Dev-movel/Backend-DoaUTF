const pool = require('../config/db');
const bcrypt = require('bcrypt');

const seedDatabase = async () => {
  try {
    console.log('🌱 Iniciando o Seed do banco de dados...');

    const senhaPadrao = await bcrypt.hash('123456', 10);

    console.log('🔹 Criando categorias...');
    const categorias = ['Roupas', 'Eletrônicos', 'Livros', 'Móveis', 'Outros'];
    for (const nome of categorias) {
      await pool.query(
        'INSERT INTO categoria (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING',
        [nome]
      );
    }

    console.log('🔹 Criando administrador...');
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

    console.log('🔹 Criando usuários de teste...');
    const usuariosParaInserir = [
      { nome: 'Guilherme Inoe', email: 'guilherme@email.com', whatsapp: '45988887777', cidade: 'Toledo', matricula: '202400123', denunciado: false, bloqueado: false },
      { nome: 'Victórya', email: 'victorya@email.com', whatsapp: '45988887778', cidade: 'maraba', matricula: '202400124', denunciado: true, bloqueado: false }, // Marcada como denunciada para testar o Flutter!
      { nome: 'Alex', email: 'alex@email.com', whatsapp: '45988887779', cidade: 'maranhao', matricula: '202400125', denunciado: true, bloqueado: false }, // Marcado como denunciado para testar o Flutter!
      { nome: 'Beatriz', email: 'beatriz@email.com', whatsapp: '45988887771', cidade: 'campo mourao', matricula: '202400126', denunciado: false, bloqueado: false }
    ];

    let primeiroUserPessoaId = null;

    for (const u of usuariosParaInserir) {
      const resUserPessoa = await pool.query(`
        INSERT INTO pessoa (nome, email, senha, is_verified, whatsapp, cidade, denunciado, bloqueado) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        ON CONFLICT (email) DO NOTHING
        RETURNING id`,
        [u.nome, u.email, senhaPadrao, true, u.whatsapp, u.cidade, u.denunciado, u.bloqueado]
      );

      if (resUserPessoa.rows.length > 0) {
        const userPessoaId = resUserPessoa.rows[0].id;
        if (!primeiroUserPessoaId) primeiroUserPessoaId = userPessoaId;

        await pool.query(
          'INSERT INTO usuario (pessoa_id, matricula) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userPessoaId, u.matricula]
        );
      }
    }

    if (primeiroUserPessoaId) {
      console.log('🔹 Criando item de exemplo...');
      const catRes = await pool.query("SELECT id FROM categoria WHERE nome = 'Roupas' LIMIT 1");
      if (catRes.rows.length > 0) {
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
            primeiroUserPessoaId
          ]
        );
      }
    }

    console.log('Banco de dados populado com sucesso!');
  } catch (error) {
    console.error('Erro durante o Seed:', error);
  } finally {
    await pool.end();
    process.exit();
  }
};

seedDatabase();