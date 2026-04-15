const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Cadastra um novo usuário com e-mail institucional
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - senha
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *                 description: Deve ser do domínio @alunos.utfpr.edu.br
 *               senha:
 *                 type: string
 *                 description: Senha do usuário (armazenada como hash bcrypt)
 *     responses:
 *       '201':
 *         description: Usuário cadastrado com sucesso
 *       '400':
 *         description: E-mail fora do domínio institucional ou já cadastrado
 */
router.post('/register', authController.register);

module.exports = router;
