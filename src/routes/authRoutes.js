const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Cadastra um novo usuário com e-mail institucional
 *     tags: [Autenticação]
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
 *               data_nascimento:
 *                 type: string
 *                 format: date
 *                 description: Data de nascimento no formato YYYY-MM-DD (opcional)
 *     responses:
 *       '201':
 *         description: Usuário cadastrado com sucesso
 *       '400':
 *         description: E-mail fora do domínio institucional ou já cadastrado
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realiza o login do usuário e retorna um token JWT
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 description: E-mail institucional (@alunos.utfpr.edu.br)
 *                 example: alexjunior.2023@alunos.utfpr.edu.br
 *               senha:
 *                 type: string
 *                 description: Senha cadastrada
 *                 example: "minhasenha"
 *     responses:
 *       '200':
 *         description: Login realizado com sucesso. Retorna o token de acesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT válido por 7 dias
 *       '401':
 *         description: Credenciais inválidas (e-mail ou senha incorretos).
 *       '500':
 *         description: Erro interno no servidor.
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renova o token de acesso (JWT) utilizando um Refresh Token
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: O token de atualização recebido no login
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       '200':
 *         description: Novo token gerado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Novo token JWT de acesso válido por 7 dias
 *                 refreshToken:
 *                   type: string
 *                   description: Novo refresh token válido por 30 dias
 *       '400':
 *         description: Refresh token não informado no corpo da requisição.
 *       '401':
 *         description: Refresh Token inválido, expirado ou já utilizado.
 *       '500':
 *         description: Erro interno no servidor.
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicita a redefinição de senha
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: E-mail institucional (@alunos.utfpr.edu.br) cadastrado
 *                 example: alexjunior.2023@alunos.utfpr.edu.br
 *     responses:
 *       '200':
 *         description: Se o e-mail estiver cadastrado, instruções de reset serão enviadas. Retorna mensagem genérica por segurança.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                   description: Mensagem confirmando o envio das instruções
 *                   example: "Se este e-mail estiver cadastrado, você receberá as instruções em breve."
 *       '500':
 *         description: Erro interno no servidor.
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Redefine a senha do usuário utilizando token de reset
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - novaSenha
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de reset enviado por e-mail (válido por 60 minutos)
 *                 example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
 *               novaSenha:
 *                 type: string
 *                 description: Nova senha para o usuário
 *                 example: "novaSenha123!"
 *     responses:
 *       '200':
 *         description: Senha redefinida com sucesso. Todos os tokens de acesso anteriores são invalidados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                   description: Confirmação de reset bem-sucedido
 *                   example: "Senha redefinida com sucesso"
 *       '400':
 *         description: Token e nova senha são obrigatórios, ou token é inválido/expirado.
 *       '500':
 *         description: Erro interno no servidor.
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Realiza o logout do usuário invalidando seus refresh tokens
 *     tags: [Autenticação]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Logout realizado com sucesso. Todos os refresh tokens foram invalidados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                   description: Confirmação de logout bem-sucedido
 *                   example: "Logout realizado com sucesso"
 *       '401':
 *         description: Token de autenticação não fornecido, inválido ou expirado.
 *       '500':
 *         description: Erro interno no servidor.
 */
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
