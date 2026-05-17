const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const solicitacaoController = require('../controllers/solicitacaoController');

/**
 * @swagger
 * tags:
 *   name: Solicitações
 *   description: Solicitações de interesse em itens para doação
 */

/**
 * @swagger
 * /solicitacoes:
 *   post:
 *     summary: Cria uma solicitação de interesse em um item
 *     tags: [Solicitações]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - item_id
 *             properties:
 *               item_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       '201':
 *         description: Solicitação criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 item_id:
 *                   type: integer
 *                 status:
 *                   type: string
 *                   example: pendente
 *                 criado_em:
 *                   type: string
 *                   format: date-time
 *       '400':
 *         description: item_id ausente ou item indisponível
 *       '401':
 *         description: Token ausente ou inválido
 *       '403':
 *         description: Usuário tentou solicitar o próprio item
 *       '404':
 *         description: Item não encontrado
 *       '409':
 *         description: Solicitação duplicada — usuário já solicitou este item
 *       '500':
 *         description: Erro interno no servidor
 */
router.post('/', authMiddleware, solicitacaoController.criarSolicitacao);

/**
 * @swagger
 * /solicitacoes/minhas:
 *   get:
 *     summary: Lista todas as solicitações feitas pelo usuário autenticado
 *     tags: [Solicitações]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de solicitações do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   status:
 *                     type: string
 *                     example: pendente
 *                   criado_em:
 *                     type: string
 *                     format: date-time
 *                   item:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       titulo:
 *                         type: string
 *                       local_retirada:
 *                         type: string
 *                       categoria:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                       doador:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *       '401':
 *         description: Token ausente ou inválido
 *       '500':
 *         description: Erro interno no servidor
 */
router.get('/minhas', authMiddleware, solicitacaoController.minhasSolicitacoes);

/**
 * @swagger
 * /solicitacoes/{id}:
 *   delete:
 *     summary: Cancela uma solicitação pendente do usuário autenticado
 *     tags: [Solicitações]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da solicitação
 *     responses:
 *       '200':
 *         description: Solicitação cancelada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                   example: Solicitação cancelada com sucesso
 *       '400':
 *         description: Solicitação não está com status pendente
 *       '401':
 *         description: Token ausente ou inválido
 *       '403':
 *         description: Acesso negado — solicitação pertence a outro usuário
 *       '404':
 *         description: Solicitação não encontrada
 *       '500':
 *         description: Erro interno no servidor
 */
router.delete('/:id', authMiddleware, solicitacaoController.cancelarSolicitacao);

module.exports = router;
