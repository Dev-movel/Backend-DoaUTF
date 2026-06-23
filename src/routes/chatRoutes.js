const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { buscarMensagens, listarConversas, naoLidas, marcarComoLido } = require('../controllers/chatController');

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Mensagens em tempo real entre doador e solicitante
 */

/**
 * @swagger
 * /chat/conversas:
 *   get:
 *     summary: Lista todas as conversas do usuário (ativas e encerradas)
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de conversas ordenadas por ativas primeiro, depois por última mensagem
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   solicitacao_id:
 *                     type: integer
 *                     example: 5
 *                   item_id:
 *                     type: integer
 *                     example: 12
 *                   titulo_item:
 *                     type: string
 *                     example: Sofá de 3 lugares
 *                   nome_outro_usuario:
 *                     type: string
 *                     example: João Silva
 *                   ultima_mensagem:
 *                     type: string
 *                     nullable: true
 *                     example: Posso pegar amanhã às 10h?
 *                   ultima_mensagem_em:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   encerrada:
 *                     type: boolean
 *                     example: false
 *                   nao_lidas:
 *                     type: integer
 *                     example: 2
 *       '401':
 *         description: Token ausente ou inválido
 *       '500':
 *         description: Erro interno no servidor
 */
router.get('/conversas', authMiddleware, listarConversas);

/**
 * @swagger
 * /chat/nao-lidas:
 *   get:
 *     summary: Lista conversas com mensagens não lidas pelo usuário autenticado
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de conversas com mensagens não lidas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   solicitacao_id:
 *                     type: integer
 *                     example: 5
 *                   meu_id:
 *                     type: integer
 *                     example: 42
 *                   nome_outro_usuario:
 *                     type: string
 *                     example: João Silva
 *                   titulo_item:
 *                     type: string
 *                     example: Sofá de 3 lugares
 *                   ultima_mensagem:
 *                     type: string
 *                     example: Posso pegar amanhã às 10h?
 *       '401':
 *         description: Token ausente ou inválido
 *       '500':
 *         description: Erro interno no servidor
 */
router.get('/nao-lidas', authMiddleware, naoLidas);

/**
 * @swagger
 * /chat/{solicitacaoId}/lido:
 *   patch:
 *     summary: Marca todas as mensagens de uma conversa como lidas
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitacaoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '204':
 *         description: Mensagens marcadas como lidas (sem corpo na resposta)
 *       '401':
 *         description: Token ausente ou inválido
 *       '403':
 *         description: Acesso negado
 *       '404':
 *         description: Solicitação não encontrada
 *       '500':
 *         description: Erro interno no servidor
 */
router.patch('/:solicitacaoId/lido', authMiddleware, marcarComoLido);

/**
 * @swagger
 * /chat/{solicitacaoId}/mensagens:
 *   get:
 *     summary: Retorna o histórico de mensagens de uma solicitação
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitacaoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da solicitação
 *     responses:
 *       '200':
 *         description: Lista de mensagens ordenadas por criado_em ASC
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   remetente_id:
 *                     type: integer
 *                     example: 42
 *                   conteudo:
 *                     type: string
 *                     example: Olá, ainda está disponível?
 *                   criado_em:
 *                     type: string
 *                     format: date-time
 *       '401':
 *         description: Token ausente ou inválido
 *       '403':
 *         description: Acesso negado — usuário não participa desta solicitação
 *       '404':
 *         description: Solicitação não encontrada
 *       '500':
 *         description: Erro interno no servidor
 */
router.get('/:solicitacaoId/mensagens', authMiddleware, buscarMensagens);

module.exports = router;
