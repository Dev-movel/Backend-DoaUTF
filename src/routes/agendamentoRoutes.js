const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middlewares/authMiddleware');
const agendamentoController = require('../controllers/agendamentoController');

/**
 * @swagger
 * tags:
 *   name: Agendamentos
 *   description: Logística e agendamento de retirada de itens
 */

/**
 * @swagger
 * /itens/{id}/agendamento:
 *   get:
 *     summary: Obtém os detalhes do agendamento vinculado a um item
 *     tags: [Agendamentos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           description: ID do item
 *     responses:
 *       '200':
 *         description: Dados do agendamento retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 item_id:
 *                   type: integer
 *                   example: 15
 *                 doador_id:
 *                   type: integer
 *                   example: 3
 *                 receptor_id:
 *                   type: integer
 *                   example: 8
 *                 data_hora:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-05-20T14:30:00Z"
 *                 status:
 *                   type: string
 *                   example: "pendente"
 *                 confirmacao_doador:
 *                   type: boolean
 *                   example: false
 *                 confirmacao_receptor:
 *                   type: boolean
 *                   example: false
 *       '401':
 *         description: Token de autenticação ausente ou inválido
 *       '404':
 *         description: Nenhum agendamento encontrado para este item
 *       '500':
 *         description: Erro interno no servidor
 */
router.get('/', authMiddleware, agendamentoController.obterPorItem);

/**
 * @swagger
 * /itens/{id}/agendamento/sugerir:
 *   post:
 *     summary: Receptor sugere um horário para retirada do item
 *     tags: [Agendamentos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data_hora
 *             properties:
 *               data_hora:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-20T14:30:00Z"
 *     responses:
 *       '200':
 *         description: Horário sugerido com sucesso
 *       '400':
 *         description: Data e hora ausentes no corpo da requisição
 *       '403':
 *         description: Acesso negado (usuário não é o receptor escolhido)
 *       '404':
 *         description: Agendamento não encontrado
 *       '422':
 *         description: A data e hora sugeridas estão no passado
 *       '500':
 *         description: Erro interno no servidor
 */
router.post('/sugerir', authMiddleware, agendamentoController.sugerirHorario);

/**
 * @swagger
 * /itens/{id}/agendamento/disponibilidade:
 *   post:
 *     summary: Doador define disponibilidade para retirada do item
 *     tags: [Agendamentos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data_hora
 *             properties:
 *               data_hora:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-20T14:30:00Z"
 *     responses:
 *       '200':
 *         description: Disponibilidade definida com sucesso
 *       '400':
 *         description: Data e hora ausentes no corpo da requisição
 *       '403':
 *         description: Acesso negado (usuário não é o doador do item)
 *       '404':
 *         description: Agendamento não encontrado
 *       '422':
 *         description: A data e hora sugeridas estão no passado
 *       '500':
 *         description: Erro interno no servidor
 */
router.post('/disponibilidade', authMiddleware, agendamentoController.proporDisponibilidade);

/**
 * @swagger
 * /itens/{id}/agendamento/confirmar:
 *   patch:
 *     summary: Confirma bilateralmente o horário sugerido
 *     tags: [Agendamentos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item
 *     responses:
 *       '200':
 *         description: Confirmação registrada (status muda se ambos confirmarem)
 *       '403':
 *         description: Acesso negado (usuário não faz parte do agendamento)
 *       '404':
 *         description: Agendamento pendente não encontrado
 *       '500':
 *         description: Erro interno no servidor
 */
router.patch('/confirmar', authMiddleware, agendamentoController.confirmarAgendamento);

/**
 * @swagger
 * /itens/{id}/agendamento/concluir:
 *   patch:
 *     summary: Marca a entrega como concluída e o item como doado
 *     tags: [Agendamentos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item
 *     responses:
 *       '200':
 *         description: Agendamento finalizado e item doado com sucesso
 *       '403':
 *         description: Apenas o doador pode concluir
 *       '404':
 *         description: Agendamento confirmado não encontrado
 *       '500':
 *         description: Erro interno no servidor
 */
router.patch('/concluir', authMiddleware, agendamentoController.concluirAgendamento);

module.exports = router;