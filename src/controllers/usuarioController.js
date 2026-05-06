const bcrypt = require('bcrypt');
const pool = require('../config/db');

const SALT_ROUNDS = 10;

// ================= LISTAR TODOS USUÁRIOS =================
const listarUsuarios = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, data_nascimento, bloqueado FROM pessoa ORDER BY id ASC'
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
  }
};

// ================= ATUALIZAR USUÁRIO POR ID (ADMIN) =================
const atualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, data_nascimento, bloqueado } = req.body;

  try {
    const { rows } = await pool.query(
      'SELECT * FROM pessoa WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    const atual = rows[0];

    const novoNome = nome ?? atual.nome;
    const novoEmail = email ?? atual.email;
    const novaSenha = senha
      ? await bcrypt.hash(senha, SALT_ROUNDS)
      : atual.senha;
    const novaDataNascimento =
      data_nascimento ?? atual.data_nascimento;
    const novoBloqueado =
      bloqueado ?? atual.bloqueado;

    const result = await pool.query(
      `UPDATE pessoa
       SET nome = $1,
           email = $2,
           senha = $3,
           data_nascimento = $4,
           bloqueado = $5
       WHERE id = $6
       RETURNING id, nome, email, data_nascimento, bloqueado`,
      [
        novoNome,
        novoEmail,
        novaSenha,
        novaDataNascimento,
        novoBloqueado,
        id,
      ]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  }
};

// ================= PEGAR PERFIL LOGADO =================
const getMe = async (req, res) => {
  const userId = req.user.sub;

  try {
    const result = await pool.query(
      `SELECT id, nome, email, whatsapp, rua, numero, bairro, cidade,
              data_nascimento, created_at
       FROM pessoa
       WHERE id = $1`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    const u = result.rows[0];

    res.status(200).json({
      id: u.id,
      nome: u.nome,
      email: u.email,
      whatsapp: u.whatsapp,
      data_nascimento: u.data_nascimento,
      endereco: {
        rua: u.rua,
        numero: u.numero,
        bairro: u.bairro,
        cidade: u.cidade,
      },
      created_at: u.created_at,
    });
  } catch (error) {
    console.error('Erro real no getMe:', error.message);
    res.status(500).json({ erro: 'Erro ao buscar perfil' });
  }
};

// ================= ATUALIZAR PERFIL LOGADO =================
const updateMe = async (req, res) => {
  const userId = req.user.sub;
  const { nome, whatsapp, endereco, data_nascimento } = req.body;

  const fields = [];
  const values = [];
  let idx = 1;

  if (nome) {
    fields.push(`nome = $${idx++}`);
    values.push(nome);
  }

  if (whatsapp) {
    fields.push(`whatsapp = $${idx++}`);
    values.push(whatsapp);
  }

  if (data_nascimento) {
    fields.push(`data_nascimento = $${idx++}`);
    values.push(data_nascimento);
  }

  if (endereco) {
    if (endereco.rua) {
      fields.push(`rua = $${idx++}`);
      values.push(endereco.rua);
    }

    if (endereco.numero) {
      fields.push(`numero = $${idx++}`);
      values.push(endereco.numero);
    }

    if (endereco.bairro) {
      fields.push(`bairro = $${idx++}`);
      values.push(endereco.bairro);
    }

    if (endereco.cidade) {
      fields.push(`cidade = $${idx++}`);
      values.push(endereco.cidade);
    }
  }

  if (fields.length === 0) {
    return res.status(422).json({ erro: 'Nada para atualizar' });
  }

  try {
    values.push(userId);

    await pool.query(
      `UPDATE pessoa
       SET ${fields.join(', ')}
       WHERE id = $${idx}`,
      values
    );

    res.status(200).json({
      mensagem: 'Perfil atualizado com sucesso',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar perfil' });
  }
};

// ================= MINHAS DOAÇÕES =================
const getMyDonations = async (req, res) => {
  const userId = req.user.sub;

  try {
    const { rows } = await pool.query(
      `SELECT id, titulo, foto_url, status
       FROM doacao
       WHERE doador_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar doações' });
  }
};

module.exports = {
  listarUsuarios,
  atualizarUsuario,
  getMe,
  updateMe,
  getMyDonations,
};