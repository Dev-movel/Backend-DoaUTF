const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middlewares/authMiddleware');
const itemController = require('../controllers/itemController');
const upload = require('../config/upload');

const handleUpload = (req, res, next) => {
    upload.array('imagens', 5)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            const mensagens = {
                LIMIT_FILE_SIZE: 'Tamanho máximo por imagem é 5 MB',
                LIMIT_FILE_COUNT: 'Máximo de 5 imagens permitidas',
                LIMIT_UNEXPECTED_FILE: err.message || 'Arquivo inválido',
            };
            return res.status(400).json({ erro: mensagens[err.code] || err.message });
        }
        if (err) {
            return res.status(400).json({ erro: err.message });
        }
        next();
    });
};

/**
 * @swagger
 * tags:
 *   name: Itens
 *   description: Cadastro e gerenciamento de itens para doação
 */

/**
 * @swagger
 * /itens:
 *   post:
 *     summary: Cadastra um novo item para doação
 *     tags: [Itens]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - descricao
 *               - categoria_id
 *               - estado_conservacao
 *               - local_retirada
 *               - imagens
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Cadeira de escritório
 *               descricao:
 *                 type: string
 *                 example: Cadeira ergonômica em bom estado
 *               categoria_id:
 *                 type: integer
 *                 example: 1
 *               estado_conservacao:
 *                 type: string
 *                 enum: [novo, usado, precisa_de_reparo]
 *                 example: usado
 *               local_retirada:
 *                 type: string
 *                 enum: [Bloco A, Bloco B, Bloco C, Bloco D, Bloco E, Bloco F, Bloco G, Biblioteca, Centro de Convivência, Aquário, RU]
 *                 example: Biblioteca
 *               imagens:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Mínimo 1, máximo 5 imagens (JPEG ou PNG, até 5 MB cada)
 *     responses:
 *       '201':
 *         description: Item cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ItemComImagens'
 *       '400':
 *         description: Campos obrigatórios ausentes, formato inválido ou imagem inválida
 *       '401':
 *         description: Token de autenticação não fornecido ou inválido
 *       '500':
 *         description: Erro interno no servidor
 */
router.post('/', authMiddleware, handleUpload, itemController.cadastrarItem);

/**
 * @swagger
 * /itens/{id}:
 *   get:
 *     summary: Retorna os detalhes de um item específico
 *     tags: [Itens]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item
 *     responses:
 *       '200':
 *         description: Detalhes do item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 titulo:
 *                   type: string
 *                 descricao:
 *                   type: string
 *                 estado_conservacao:
 *                   type: string
 *                 local_retirada:
 *                   type: string
 *                 status:
 *                   type: string
 *                 criado_em:
 *                   type: string
 *                   format: date-time
 *                 pessoa_id:
 *                   type: integer
 *                 categoria:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                 imagens:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       caminho:
 *                         type: string
 *       '404':
 *         description: Item não encontrado
 *       '500':
 *         description: Erro interno no servidor
 */
router.get('/:id', itemController.buscarItem);

/**
 * @swagger
 * /itens/{id}:
 *   put:
 *     summary: Edita um item do doador autenticado
 *     tags: [Itens]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item a editar
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               descricao:
 *                 type: string
 *               categoria_id:
 *                 type: integer
 *               estado_conservacao:
 *                 type: string
 *                 enum: [novo, usado, precisa_de_reparo]
 *               local_retirada:
 *                 type: string
 *                 enum: [Bloco A, Bloco B, Bloco C, Bloco D, Bloco E, Bloco F, Bloco G, Biblioteca, Centro de Convivência, Aquário, RU]
 *               imagens:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Novas imagens (substitui todas as existentes). Se omitido, imagens atuais são mantidas.
 *     responses:
 *       '200':
 *         description: Item atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ItemComImagens'
 *       '400':
 *         description: Valor de campo inválido ou categoria não encontrada
 *       '401':
 *         description: Token de autenticação não fornecido ou inválido
 *       '403':
 *         description: Acesso negado — o item pertence a outro usuário
 *       '404':
 *         description: Item não encontrado
 *       '500':
 *         description: Erro interno no servidor
 */
router.put('/:id', authMiddleware, handleUpload, itemController.editarItem);

/**
 * @swagger
 * /itens/{id}:
 *   delete:
 *     summary: Remove um item do doador autenticado
 *     tags: [Itens]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item a remover
 *     responses:
 *       '200':
 *         description: Item removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                   example: Item removido com sucesso
 *       '401':
 *         description: Token de autenticação não fornecido ou inválido
 *       '403':
 *         description: Acesso negado — o item pertence a outro usuário
 *       '404':
 *         description: Item não encontrado
 *       '500':
 *         description: Erro interno no servidor
 */
router.delete('/:id', authMiddleware, itemController.removerItem);

/**
 * @swagger
 * components:
 *   schemas:
 *     ItemComImagens:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         titulo:
 *           type: string
 *         descricao:
 *           type: string
 *         categoria_id:
 *           type: integer
 *         estado_conservacao:
 *           type: string
 *         local_retirada:
 *           type: string
 *         status:
 *           type: string
 *           example: disponivel
 *         criado_em:
 *           type: string
 *           format: date-time
 *         imagens:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               caminho:
 *                 type: string
 */

module.exports = router;
