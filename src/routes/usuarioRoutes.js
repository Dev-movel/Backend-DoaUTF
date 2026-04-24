const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

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
 * /usuarios/{id}:
 *   patch:
 *     summary: Atualiza parcialmente o perfil de um usuário
 *     tags: [Usuários]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *                 description: Deve ser do domínio @alunos.utfpr.edu.br
 *               senha:
 *                 type: string
 *                 description: Nova senha (armazenada como hash bcrypt)
 *               data_nascimento:
 *                 type: string
 *                 format: date
 *                 description: Data de nascimento no formato YYYY-MM-DD
 *     responses:
 *       '200':
 *         description: Usuário atualizado com sucesso
 *       '400':
 *         description: E-mail fora do domínio institucional
 *       '404':
 *         description: Usuário não encontrado
 */
router.patch('/:id', usuarioController.atualizarUsuario);

module.exports = router;
