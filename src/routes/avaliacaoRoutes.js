// src/routes/avaliacaoRoutes.js
const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controllers/avaliacaoController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Avaliações
 *   description: Sistema de avaliações de usuários após conclusão de doações
 */

/**
 * @swagger
 * /avaliacao/users/me/reputacao:
 *   get:
 *     summary: Obter a reputação do usuário autenticado
 *     tags: [Avaliações]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Dados de reputação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_avaliacoes:
 *                   type: integer
 *                 media_avaliacoes:
 *                   type: number
 *                   format: float
 *                 cinco_estrelas:
 *                   type: integer
 *                 quatro_ou_mais_estrelas:
 *                   type: integer
 *       '401':
 *         description: Token ausente ou inválido
 */
router.get('/users/me/reputacao', authMiddleware, avaliacaoController.minhaReputacao);

/**
 * @swagger
 * /avaliacao/donations/{itemId}/review:
 *   post:
 *     summary: Criar uma avaliação para um item entregue
 *     tags: [Avaliações]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item doado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nota
 *             properties:
 *               nota:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Nota de 1 a 5 estrelas
 *               comentario:
 *                 type: string
 *                 maxLength: 500
 *                 description: Comentário opcional (máx 500 caracteres)
 *     responses:
 *       '201':
 *         description: Avaliação enviada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 avaliacao:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     item_id:
 *                       type: integer
 *                     avaliador_id:
 *                       type: integer
 *                     avaliado_id:
 *                       type: integer
 *                     nota:
 *                       type: integer
 *                     comentario:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       '403':
 *         description: Acesso negado (item não entregue, não é participante, etc)
 *       '404':
 *         description: Item não encontrado
 *       '409':
 *         description: Avaliação duplicada — você já avaliou esta doação
 *       '410':
 *         description: Prazo de 7 dias para avaliação expirou
 *       '422':
 *         description: Nota ou comentário inválido
 *       '401':
 *         description: Token ausente ou inválido
 */
router.post('/donations/:itemId/review', authMiddleware, avaliacaoController.criarAvaliacao);

/**
 * @swagger
 * /avaliacao/users/{userId}/reviews:
 *   get:
 *     summary: Listar avaliações recebidas por um usuário
 *     tags: [Avaliações]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *     responses:
 *       '200':
 *         description: Lista de avaliações e reputação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avaliacoes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nota:
 *                         type: integer
 *                       comentario:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       avaliador_id:
 *                         type: integer
 *                       avaliador_nome:
 *                         type: string
 *                       item_id:
 *                         type: integer
 *                       item_titulo:
 *                         type: string
 *                 reputacao:
 *                   type: object
 *                   properties:
 *                     total_avaliacoes:
 *                       type: integer
 *                     media_avaliacoes:
 *                       type: number
 *                       format: float
 *                     cinco_estrelas:
 *                       type: integer
 *                     quatro_ou_mais_estrelas:
 *                       type: integer
 *                 paginacao:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       '404':
 *         description: Usuário não encontrado
 */
router.get('/users/:userId/reviews', avaliacaoController.listarAvaliacoes);

/**
 * @swagger
 * /avaliacao/reviews/{avaliacaoId}/report:
 *   post:
 *     summary: Denunciar uma avaliação inapropriada
 *     tags: [Avaliações]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: avaliacaoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da avaliação
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *                 maxLength: 255
 *                 description: Motivo da denúncia (opcional)
 *     responses:
 *       '201':
 *         description: Denúncia enviada com sucesso
 *       '403':
 *         description: Você não pode denunciar sua própria avaliação
 *       '404':
 *         description: Avaliação não encontrada
 *       '409':
 *         description: Você já denunciou esta avaliação
 *       '422':
 *         description: Motivo inválido
 *       '401':
 *         description: Token ausente ou inválido
 */
router.post('/reviews/:avaliacaoId/report', authMiddleware, avaliacaoController.denunciarAvaliacao);

module.exports = router;