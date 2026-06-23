const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const ESTADOS_CONSERVACAO = ['novo', 'usado', 'precisa_de_reparo'];

const LOCAIS_RETIRADA = [
    'Bloco A',
    'Bloco B',
    'Bloco C',
    'Bloco D',
    'Bloco E',
    'Bloco F',
    'Bloco G',
    'Biblioteca',
    'Centro de Convivência',
    'Aquário',
    'RU',
];

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const removerArquivo = (caminho) => {
    const absoluto = path.join(__dirname, '../../', caminho);
    fs.unlink(absoluto, (err) => {
        if (err) console.error('Erro ao remover arquivo:', err.message);
    });
};

const cadastrarItem = async (req, res) => {
    const pessoaId = req.user.sub;
    const { titulo, descricao, categoria_id, estado_conservacao, local_retirada } = req.body;
    const arquivos = req.files;

    const camposAusentes = [];
    if (!titulo) camposAusentes.push('titulo');
    if (!descricao) camposAusentes.push('descricao');
    if (!categoria_id) camposAusentes.push('categoria_id');
    if (!estado_conservacao) camposAusentes.push('estado_conservacao');
    if (!local_retirada) camposAusentes.push('local_retirada');

    if (camposAusentes.length > 0) {
        return res.status(400).json({
            erro: `Campos obrigatórios ausentes: ${camposAusentes.join(', ')}`,
        });
    }

    if (!arquivos || arquivos.length === 0) {
        return res.status(400).json({ erro: 'Ao menos 1 imagem é obrigatória' });
    }

    if (!ESTADOS_CONSERVACAO.includes(estado_conservacao)) {
        return res.status(400).json({
            erro: `estado_conservacao inválido. Valores aceitos: ${ESTADOS_CONSERVACAO.join(', ')}`,
        });
    }

    if (!LOCAIS_RETIRADA.includes(local_retirada)) {
        return res.status(400).json({
            erro: `local_retirada inválido. Valores aceitos: ${LOCAIS_RETIRADA.join(', ')}`,
        });
    }

    try {
        const categoriaResult = await pool.query(
            'SELECT id FROM categoria WHERE id = $1',
            [categoria_id]
        );

        if (categoriaResult.rowCount === 0) {
            return res.status(400).json({ erro: 'Categoria não encontrada' });
        }

        const itemResult = await pool.query(
            `INSERT INTO item (titulo, descricao, categoria_id, estado_conservacao, local_retirada, status, pessoa_id)
             VALUES ($1, $2, $3, $4, $5, 'disponivel', $6)
             RETURNING id, titulo, descricao, categoria_id, estado_conservacao, local_retirada, status, criado_em`,
            [titulo, descricao, categoria_id, estado_conservacao, local_retirada, pessoaId]
        );

        const novoItem = itemResult.rows[0];

        const imagensInseridas = [];
        for (const arquivo of arquivos) {
            const caminhoRelativo = `uploads/${arquivo.filename}`;
            const imagemResult = await pool.query(
                'INSERT INTO item_imagem (item_id, caminho) VALUES ($1, $2) RETURNING id, caminho',
                [novoItem.id, caminhoRelativo]
            );
            imagensInseridas.push(imagemResult.rows[0]);
        }

        return res.status(201).json({
            ...novoItem,
            imagens: imagensInseridas,
        });
    } catch (error) {
        console.error('Erro ao cadastrar item:', error);
        res.status(500).json({ erro: 'Erro ao cadastrar item' });
    }
};

const buscarItem = async (req, res) => {
    const { id } = req.params;

    try {
        const itemResult = await pool.query(
            `SELECT i.id, i.titulo, i.descricao, i.estado_conservacao, i.local_retirada,
                    i.status, i.criado_em, i.pessoa_id,
                    c.id AS categoria_id, c.nome AS categoria_nome
             FROM item i
             JOIN categoria c ON c.id = i.categoria_id
             WHERE i.id = $1`,
            [id]
        );

        if (itemResult.rowCount === 0) {
            return res.status(404).json({ erro: 'Item não encontrado' });
        }

        const item = itemResult.rows[0];

        const imagensResult = await pool.query(
            'SELECT id, caminho FROM item_imagem WHERE item_id = $1 ORDER BY id',
            [id]
        );

        return res.status(200).json({
            id: item.id,
            titulo: item.titulo,
            descricao: item.descricao,
            estado_conservacao: item.estado_conservacao,
            local_retirada: item.local_retirada,
            status: item.status,
            criado_em: item.criado_em,
            pessoa_id: item.pessoa_id,
            categoria: { id: item.categoria_id, nome: item.categoria_nome },
            imagens: imagensResult.rows,
        });
    } catch (error) {
        console.error('Erro ao buscar item:', error);
        res.status(500).json({ erro: 'Erro ao buscar item' });
    }
};

const editarItem = async (req, res) => {
    const pessoaId = req.user.sub;
    const { id } = req.params;
    const { titulo, descricao, categoria_id, estado_conservacao, local_retirada } = req.body;
    const novosArquivos = req.files;

    try {
        const itemResult = await pool.query(
            'SELECT id, pessoa_id FROM item WHERE id = $1',
            [id]
        );

        if (itemResult.rowCount === 0) {
            return res.status(404).json({ erro: 'Item não encontrado' });
        }

        if (itemResult.rows[0].pessoa_id !== pessoaId) {
            return res.status(403).json({ erro: 'Acesso negado: você não é o dono deste item' });
        }

        if (estado_conservacao && !ESTADOS_CONSERVACAO.includes(estado_conservacao)) {
            return res.status(400).json({
                erro: `estado_conservacao inválido. Valores aceitos: ${ESTADOS_CONSERVACAO.join(', ')}`,
            });
        }

        if (local_retirada && !LOCAIS_RETIRADA.includes(local_retirada)) {
            return res.status(400).json({
                erro: `local_retirada inválido. Valores aceitos: ${LOCAIS_RETIRADA.join(', ')}`,
            });
        }

        if (categoria_id) {
            const categoriaResult = await pool.query(
                'SELECT id FROM categoria WHERE id = $1',
                [categoria_id]
            );
            if (categoriaResult.rowCount === 0) {
                return res.status(400).json({ erro: 'Categoria não encontrada' });
            }
        }

        const itemAtualizado = await pool.query(
            `UPDATE item SET
                titulo            = COALESCE($1, titulo),
                descricao         = COALESCE($2, descricao),
                categoria_id      = COALESCE($3, categoria_id),
                estado_conservacao = COALESCE($4, estado_conservacao),
                local_retirada    = COALESCE($5, local_retirada)
             WHERE id = $6
             RETURNING id, titulo, descricao, categoria_id, estado_conservacao, local_retirada, status, criado_em`,
            [titulo || null, descricao || null, categoria_id || null, estado_conservacao || null, local_retirada || null, id]
        );

        let imagens;

        if (novosArquivos && novosArquivos.length > 0) {
            const antigasResult = await pool.query(
                'SELECT caminho FROM item_imagem WHERE item_id = $1',
                [id]
            );
            antigasResult.rows.forEach((img) => removerArquivo(img.caminho));

            await pool.query('DELETE FROM item_imagem WHERE item_id = $1', [id]);

            const imagensInseridas = [];
            for (const arquivo of novosArquivos) {
                const caminhoRelativo = `uploads/${arquivo.filename}`;
                const imagemResult = await pool.query(
                    'INSERT INTO item_imagem (item_id, caminho) VALUES ($1, $2) RETURNING id, caminho',
                    [id, caminhoRelativo]
                );
                imagensInseridas.push(imagemResult.rows[0]);
            }
            imagens = imagensInseridas;
        } else {
            const imagensResult = await pool.query(
                'SELECT id, caminho FROM item_imagem WHERE item_id = $1 ORDER BY id',
                [id]
            );
            imagens = imagensResult.rows;
        }

        return res.status(200).json({
            ...itemAtualizado.rows[0],
            imagens,
        });
    } catch (error) {
        console.error('Erro ao editar item:', error);
        res.status(500).json({ erro: 'Erro ao editar item' });
    }
};

const STATUS_VALIDOS = ['disponivel', 'doado', 'excluido', 'todos'];

const listarItens = async (req, res) => {
    const { categoria, busca, pagina = 1, status = 'disponivel' } = req.query;

    if (!STATUS_VALIDOS.includes(status)) {
        return res.status(400).json({
            erro: `status inválido. Valores aceitos: ${STATUS_VALIDOS.join(', ')}`,
        });
    }

    const limite = 9;
    const offset = (Math.max(1, parseInt(pagina) || 1) - 1) * limite;
    const params = [];
    const condicoes = [];

    let usuarioLogadoId = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            usuarioLogadoId = payload.sub;
        } catch (_) {
            usuarioLogadoId = null;
        }
    }

    if (status !== 'todos') {
        if (status === 'disponivel' && usuarioLogadoId) {
            params.push(usuarioLogadoId);
            const userParam = `$${params.length}`;
            condicoes.push(`(
                i.status = 'disponivel'
                OR (
                    i.status IN ('reservado')
                    AND (
                        i.pessoa_id = ${userParam}
                        OR EXISTS(
                            SELECT 1 FROM solicitacao s WHERE s.item_id = i.id AND s.solicitante_pessoa_id = ${userParam}
                        )
                    )
                )
            )`);
        } else {
            condicoes.push(`i.status = '${status}'`);
        }
    }

    if (categoria) {
        params.push(`%${categoria}%`);
        condicoes.push(`c.nome ILIKE $${params.length}`);
    }

    if (busca) {
        params.push(`%${busca}%`);
        condicoes.push(`(i.titulo ILIKE $${params.length} OR i.descricao ILIKE $${params.length})`);
    }

    params.push(limite);
    const limiteParam = params.length;
    params.push(offset);
    const offsetParam = params.length;

    try {
        const result = await pool.query(
            `SELECT
                i.id,
                i.titulo,
                i.status,
                i.descricao,
                i.estado_conservacao,
                i.local_retirada,
                i.criado_em,
                c.nome AS categoria_nome,
                p.id AS doador_id,
                p.nome AS doador_nome,
                ARRAY(SELECT ii.caminho FROM item_imagem ii WHERE ii.item_id = i.id ORDER BY ii.id) AS fotos_caminhos
             FROM item i
             JOIN categoria c ON c.id = i.categoria_id
             JOIN pessoa p ON p.id = i.pessoa_id
             WHERE ${condicoes.length > 0 ? condicoes.join(' AND ') : 'TRUE'}
             ORDER BY i.criado_em DESC
             LIMIT $${limiteParam} OFFSET $${offsetParam}`,
            params
        );

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const itens = result.rows.map((row) => ({
            id: row.id,
            titulo: row.titulo,
            fotos: (row.fotos_caminhos || []).map((caminho) => `${baseUrl}/${caminho}`),
            status: row.status,
            descricao: row.descricao,
            estado_conservacao: row.estado_conservacao,
            local_retirada: row.local_retirada,
            criado_em: row.criado_em,
            categoria: { nome: row.categoria_nome },
            doador: { id: row.doador_id, nome: row.doador_nome },
        }));

        return res.status(200).json(itens);
    } catch (error) {
        console.error('Erro ao listar itens:', error);
        res.status(500).json({ erro: 'Erro ao listar itens' });
    }
};

const removerItem = async (req, res) => {
    const pessoaId = req.user.sub; 
    const { id } = req.params;

    try {
        const itemResult = await pool.query(
            'SELECT id, pessoa_id FROM item WHERE id = $1',
            [id]
        );

        if (itemResult.rowCount === 0) {
            return res.status(404).json({ erro: 'Item não encontrado' });
        }

        if (itemResult.rows[0].pessoa_id !== pessoaId) {
            return res.status(403).json({ erro: 'Acesso negado: você não é o dono deste item' });
        }

        const imagensResult = await pool.query(
            'SELECT caminho FROM item_imagem WHERE item_id = $1',
            [id]
        );
        imagensResult.rows.forEach((img) => removerArquivo(img.caminho));

        await pool.query('DELETE FROM item WHERE id = $1', [id]);

        return res.status(200).json({ mensagem: 'Item removido com sucesso' });
    } catch (error) {
        console.error('Erro ao remover item:', error);
        res.status(500).json({ erro: 'Erro ao remover item' });
    }
};

// ================= REMOVER ITEM DENUNCIADO (ADMIN) =================
const removerItemAdmin = async (req, res) => {
    const { id } = req.params; // ID do item vindo da rota

    try {
        // 1. Verificar se o item existe no banco
        const itemResult = await pool.query(
            'SELECT id FROM item WHERE id = $1',
            [id]
        );

        if (itemResult.rowCount === 0) {
            return res.status(404).json({ erro: 'Item não encontrado' });
        }

        // 2. Buscar e apagar os arquivos físicos de imagem do servidor de arquivos (uploads/)
        const imagensResult = await pool.query(
            'SELECT caminho FROM item_imagem WHERE item_id = $1',
            [id]
        );
        imagensResult.rows.forEach((img) => removerArquivo(img.caminho));

        // 3. Remover primeiro as denúncias atreladas a este item para evitar erro de Foreign Key
        await pool.query('DELETE FROM item_denuncia WHERE item_id = $1', [id]);

        // 4. Remover o item da tabela principal (suas imagens na tabela item_imagem devem cair por CASCADE)
        await pool.query('DELETE FROM item WHERE id = $1', [id]);

        return res.status(200).json({ mensagem: 'O item denunciado foi removido com sucesso pelo administrador.' });
    } catch (error) {
        console.error('Erro ao remover item pelo admin:', error);
        res.status(500).json({ erro: 'Erro interno ao remover item denunciado.' });
    }
};

const listarItensAtivosAdmin = async (req, res) => {
        try {
        const result = await pool.query(
            `SELECT
                i.id,
                i.titulo,
                i.status,
                i.descricao,
                i.estado_conservacao,
                i.local_retirada,
                i.criado_em,
                c.nome AS categoria_nome,
                p.nome AS doador_nome,
                ARRAY(SELECT ii.caminho FROM item_imagem ii WHERE ii.item_id = i.id ORDER BY ii.id) AS fotos_caminhos
             FROM item i
             JOIN categoria c ON c.id = i.categoria_id
             JOIN pessoa p ON p.id = i.pessoa_id
             WHERE i.status IN ('disponivel', 'reservado')
             ORDER BY i.criado_em DESC`
        );

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const itens = result.rows.map((row) => ({
            id: row.id,
            titulo: row.titulo,
            status: row.status,
            descricao: row.descricao,
            estado_conservacao: row.estado_conservacao,
            local_retirada: row.local_retirada,
            created_at: row.criado_em, 
            nome_doador: row.doador_nome,
            imagens: (row.fotos_caminhos || []).map((caminho) => `${baseUrl}/${caminho}`),
        }));

        return res.status(200).json(itens);
    } catch (error) {
        console.error('Erro ao listar itens no admin:', error);
        res.status(500).json({ erro: 'Erro interno ao listar doações ativas.' });
    }
};

module.exports = { 
    cadastrarItem, 
    listarItens, 
    buscarItem, 
    editarItem, 
    removerItem, 
    removerItemAdmin, // Exportado aqui!
    listarItensAtivosAdmin,
    LOCAIS_RETIRADA, 
    ESTADOS_CONSERVACAO 
};