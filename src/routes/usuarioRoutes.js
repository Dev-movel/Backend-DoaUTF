const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Lista todos os usuários cadastrados
 *     tags: [Usuários]
 *     responses:
 *       '200':
 *         description: Lista de usuários
 */
router.get('/', usuarioController.listarUsuarios);

/**
 * @swagger
 * /usuarios/me:
 *   get:
 *     summary: Retorna o perfil do usuário autenticado
 *     tags: [Usuários]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Dados do perfil do usuário (nunca expõe a senha)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nome:
 *                   type: string
 *                 email:
 *                   type: string
 *                 whatsapp:
 *                   type: string
 *                 data_nascimento:
 *                   type: string
 *                   format: date
 *                 endereco:
 *                   type: object
 *                   properties:
 *                     rua:
 *                       type: string
 *                     numero:
 *                       type: string
 *                     bairro:
 *                       type: string
 *                     cidade:
 *                       type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       '401':
 *         description: Não autorizado (Token ausente ou inválido)
 *       '404':
 *         description: Usuário não encontrado
 */
router.get('/me', authMiddleware, usuarioController.getMe);

/**
 * @swagger
 * /usuarios/me:
 *   patch:
 *     summary: Atualiza parcialmente o perfil do usuário autenticado
 *     tags: [Usuários]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Apenas os campos enviados serão atualizados (partial update)
 *             properties:
 *               nome:
 *                 type: string
 *               whatsapp:
 *                 type: string
 *               data_nascimento:
 *                 type: string
 *                 format: date
 *               endereco:
 *                 type: object
 *                 properties:
 *                   rua:
 *                     type: string
 *                   numero:
 *                     type: string
 *                   bairro:
 *                     type: string
 *                   cidade:
 *                     type: string
 *     responses:
 *       '200':
 *         description: Perfil atualizado com sucesso
 *       '401':
 *         description: Não autorizado (Token ausente ou inválido)
 *       '422':
 *         description: Nenhum campo válido foi enviado para atualização
 */
router.patch('/me', authMiddleware, usuarioController.updateMe);

/**
 * @swagger
 * /usuarios/me/donations:
 *   get:
 *     summary: Lista as doações realizadas pelo usuário autenticado
 *     tags: [Usuários]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de doações do usuário (ordenada pelas mais recentes)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   titulo:
 *                     type: string
 *                   foto_url:
 *                     type: string
 *                   status:
 *                     type: string
 *                     description: Status atual da doação
 *       '401':
 *         description: Não autorizado (Token ausente ou inválido)
 */
router.get('/me/donations', authMiddleware, usuarioController.getMyDonations);

module.exports = router;
