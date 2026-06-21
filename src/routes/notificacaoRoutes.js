const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const notificacaoController = require('../controllers/notificacaoController');

/**
 * @swagger
 * tags:
 *   name: Notificações
 *   description: Central de notificações do usuário autenticado
 */

/**
 * @swagger
 * /notificacoes:
 *   get:
 *     summary: Lista as notificações do usuário autenticado
 *     tags: [Notificações]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: apenas_nao_lidas
 *         schema:
 *           type: boolean
 *         description: Se true, retorna apenas notificações não lidas
 *     responses:
 *       '200':
 *         description: Lista de notificações (máx. 50, ordenadas da mais recente)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   tipo:
 *                     type: string
 *                     example: nova_solicitacao
 *                   mensagem:
 *                     type: string
 *                     example: João demonstrou interesse no seu Livro de Cálculo!
 *                   dados:
 *                     type: object
 *                     nullable: true
 *                     example: { item_id: 3, item_titulo: "Livro de Cálculo", usuario_nome: "João" }
 *                   lida:
 *                     type: boolean
 *                   criado_em:
 *                     type: string
 *                     format: date-time
 *       '401':
 *         description: Token ausente ou inválido
 *       '500':
 *         description: Erro interno no servidor
 */
router.get('/', authMiddleware, notificacaoController.listarNotificacoes);

/**
 * @swagger
 * /notificacoes/nao-lidas/count:
 *   get:
 *     summary: Retorna a contagem de notificações não lidas
 *     tags: [Notificações]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Total de notificações não lidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 4
 *       '401':
 *         description: Token ausente ou inválido
 *       '500':
 *         description: Erro interno no servidor
 */
router.get('/nao-lidas/count', authMiddleware, notificacaoController.contarNaoLidas);

/**
 * @swagger
 * /notificacoes/lidas:
 *   patch:
 *     summary: Marca todas as notificações do usuário como lidas
 *     tags: [Notificações]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Todas as notificações marcadas como lidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                   example: Todas as notificacoes marcadas como lidas
 *       '401':
 *         description: Token ausente ou inválido
 *       '500':
 *         description: Erro interno no servidor
 */
router.patch('/lidas', authMiddleware, notificacaoController.marcarTodasComoLidas);

/**
 * @swagger
 * /notificacoes/{id}/lida:
 *   patch:
 *     summary: Marca uma notificação específica como lida
 *     tags: [Notificações]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da notificação
 *     responses:
 *       '200':
 *         description: Notificação marcada como lida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                   example: Notificacao marcada como lida
 *       '401':
 *         description: Token ausente ou inválido
 *       '404':
 *         description: Notificação não encontrada
 *       '500':
 *         description: Erro interno no servidor
 */
router.patch('/:id/lida', authMiddleware, notificacaoController.marcarComoLida);

module.exports = router;
