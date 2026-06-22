const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { buscarMensagens } = require('../controllers/chatController');

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Mensagens em tempo real entre doador e solicitante
 */

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
