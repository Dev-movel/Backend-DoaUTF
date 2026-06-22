const pool = require('../config/db');

// ================= CRIAR DENÚNCIA DE UM POST =================
const denunciarPost = async (req, res) => {
  const { itemId, motivo, descricao } = req.body;
  const denuncianteId = req.user.sub; 

  if (!itemId || !motivo) {
    return res.status(400).json({ erro: 'Item ID e motivo são obrigatórios.' });
  }

  try {
    await pool.query(
      `INSERT INTO item_denuncia (item_id, denunciante_pessoa_id, motivo, descricao)
       VALUES ($1, $2, $3, $4)`,
      [itemId, denuncianteId, motivo, descricao || '']
    );

    res.status(201).json({ mensagem: 'Post denunciado com sucesso! Nosso time irá analisar.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao registrar denúncia do post.' });
  }
};

// ================= LISTAR POSTS DENUNCIADOS (ADMIN) =================
const listarPostsDenunciados = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        id_denuncia.id AS denuncia_id,
        id_denuncia.motivo,
        id_denuncia.descricao,
        id_denuncia.criado_em AS data_denuncia,
        i.id AS item_id,
        i.titulo AS item_titulo,
        i.status AS item_status,
        p.nome AS nome_doador
      FROM item_denuncia id_denuncia
      JOIN item i ON id_denuncia.item_id = i.id
      JOIN pessoa p ON i.pessoa_id = p.id 
      ORDER BY id_denuncia.criado_em DESC
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar posts denunciados.' });
  }
};

module.exports = {
  denunciarPost,
  listarPostsDenunciados
};