const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Lista todos os usuários cadastrados
 *     responses:
 *       '200':
 *         description: Lista de usuários
 */
router.get('/', usuarioController.listarUsuarios);

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Cadastra um novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Usuário criado com sucesso
 */
router.post('/', usuarioController.criarUsuario);

module.exports = router;