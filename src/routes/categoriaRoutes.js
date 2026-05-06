const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const categoriaController = require('../controllers/categoriaController');

/**
 * @swagger
 * tags:
 *   name: Categorias
 *   description: Gerenciamento de categorias de itens
 */

/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Lista todas as categorias
 *     tags: [Categorias]
 *     responses:
 *       '200':
 *         description: Lista de categorias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Categoria'
 *       '500':
 *         description: Erro interno no servidor
 */
router.get('/', categoriaController.listarCategorias);

/**
 * @swagger
 * /categorias/{id}:
 *   get:
 *     summary: Retorna uma categoria pelo ID
 *     tags: [Categorias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Categoria encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categoria'
 *       '404':
 *         description: Categoria não encontrada
 *       '500':
 *         description: Erro interno no servidor
 */
router.get('/:id', categoriaController.buscarCategoria);

/**
 * @swagger
 * /categorias:
 *   post:
 *     summary: Cria uma nova categoria
 *     tags: [Categorias]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Eletrônicos
 *     responses:
 *       '201':
 *         description: Categoria criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categoria'
 *       '400':
 *         description: Nome ausente ou já existente
 *       '401':
 *         description: Token de autenticação não fornecido ou inválido
 *       '500':
 *         description: Erro interno no servidor
 */
router.post('/', authMiddleware, categoriaController.criarCategoria);

/**
 * @swagger
 * /categorias/{id}:
 *   put:
 *     summary: Atualiza o nome de uma categoria
 *     tags: [Categorias]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Móveis
 *     responses:
 *       '200':
 *         description: Categoria atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categoria'
 *       '400':
 *         description: Nome ausente ou já existente
 *       '401':
 *         description: Token de autenticação não fornecido ou inválido
 *       '404':
 *         description: Categoria não encontrada
 *       '500':
 *         description: Erro interno no servidor
 */
router.put('/:id', authMiddleware, categoriaController.atualizarCategoria);

/**
 * @swagger
 * /categorias/{id}:
 *   delete:
 *     summary: Remove uma categoria
 *     tags: [Categorias]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Categoria removida com sucesso
 *       '400':
 *         description: Categoria possui itens vinculados e não pode ser removida
 *       '401':
 *         description: Token de autenticação não fornecido ou inválido
 *       '404':
 *         description: Categoria não encontrada
 *       '500':
 *         description: Erro interno no servidor
 */
router.delete('/:id', authMiddleware, categoriaController.removerCategoria);

/**
 * @swagger
 * components:
 *   schemas:
 *     Categoria:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nome:
 *           type: string
 *           example: Eletrônicos
 */

module.exports = router;