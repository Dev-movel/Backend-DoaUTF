const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = '7d';
const JWT_REFRESH_EXPIRES_IN = '30d';
const RESET_TOKEN_EXPIRES_MINUTES = 60;

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ sub: userId }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
    const refreshToken = jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
    return { accessToken, refreshToken };
};

const register = async (req, res) => {
    const { nome, email, senha, data_nascimento } = req.body;

    if (!email.endsWith('@alunos.utfpr.edu.br')) {
        return res.status(400).json({ erro: 'O email deve ser do domínio @alunos.utfpr.edu.br' });
    }

    const existente = await pool.query('SELECT id FROM pessoa WHERE email = $1', [email]);
    if (existente.rowCount > 0) {
        return res.status(400).json({ erro: 'E-mail já cadastrado' });
    }

    try {
        const hash = await bcrypt.hash(senha, SALT_ROUNDS);
        const result = await pool.query(
            'INSERT INTO pessoa (nome, email, senha, data_nascimento) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, data_nascimento',
            [nome, email, hash, data_nascimento ?? null]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
    }
};

const login = async (req, res) => {
    const { email, senha, password } = req.body;
    const passwordToCheck = senha || password;

    const INVALID_MSG = 'Credenciais inválidas';

    console.log('Dados recebidos no login:', {
        email: email ? `${email.substring(0, 5)}...` : 'NÃO ENVIADO',
        password: passwordToCheck ? '***' : 'NÃO ENVIADO',
        corpo_completo: req.body
    });

    if (!email || !passwordToCheck) {
        console.error('Email ou senha faltando:', { email: !!email, passwordToCheck: !!passwordToCheck });
        return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    try {
        const result = await pool.query(
            'SELECT id, senha FROM pessoa WHERE email = $1',
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ erro: INVALID_MSG });
        }

        const user = result.rows[0];

        if (!user.senha) {
            console.error(`Usuário ${email} não tem senha definida no banco`);
            return res.status(401).json({ erro: INVALID_MSG });
        }

        const passwordMatch = await bcrypt.compare(passwordToCheck, user.senha);

        if (!passwordMatch) {
            return res.status(401).json({ erro: INVALID_MSG });
        }

        const { accessToken, refreshToken } = generateTokens(user.id);

        const refreshHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
        await pool.query(
            `INSERT INTO refresh_token (pessoa_id, token_hash, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
            [user.id, refreshHash]
        );

        console.log(`Login bem-sucedido para: ${email}`);
        return res.status(200).json({ accessToken, refreshToken });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ erro: 'Erro ao realizar login' });
    }
};

const logout = async (req, res) => {
    const userId = req.user.sub;

    try {
        await pool.query(
            'DELETE FROM refresh_token WHERE pessoa_id = $1',
            [userId]
        );

        return res.status(200).json({ mensagem: 'Logout realizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao realizar logout' });
    }
};

const refresh = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ erro: 'Refresh token não informado' });
    }

    try {
        let payload;
        try {
            payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        } catch {
            return res.status(401).json({ erro: 'Refresh token inválido ou expirado' });
        }

        const userId = payload.sub;

        const stored = await pool.query(
            `SELECT id, token_hash FROM refresh_token
             WHERE pessoa_id = $1 AND expires_at > NOW()`,
            [userId]
        );

        let matchedRow = null;
        for (const row of stored.rows) {
            const match = await bcrypt.compare(refreshToken, row.token_hash);
            if (match) {
                matchedRow = row;
                break;
            }
        }

        if (!matchedRow) {
            return res.status(401).json({ erro: 'Refresh token inválido ou já utilizado' });
        }

        await pool.query('DELETE FROM refresh_token WHERE id = $1', [matchedRow.id]);

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(userId);
        const newHash = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);

        await pool.query(
            `INSERT INTO refresh_token (pessoa_id, token_hash, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
            [userId, newHash]
        );

        return res.status(200).json({
            accessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao renovar sessão' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    const SUCCESS_MSG =
        'Se este e-mail estiver cadastrado, você receberá as instruções em breve.';

    try {
        const result = await pool.query(
            'SELECT id FROM pessoa WHERE email = $1',
            [email]
        );

        res.status(200).json({ mensagem: SUCCESS_MSG });

        if (result.rowCount === 0) return;

        const userId = result.rows[0].id;

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

        await pool.query(
            'DELETE FROM password_reset_token WHERE pessoa_id = $1',
            [userId]
        );

        await pool.query(
            `INSERT INTO password_reset_token (pessoa_id, token_hash, expires_at)
             VALUES ($1, $2, $3)`,
            [userId, tokenHash, expiresAt]
        );

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

        const { sendPasswordReset } = require('../config/mailer');

        sendPasswordReset(email, resetLink).catch((err) => {
            console.error(`Falha ao enviar e-mail para ${email}:`, err.message);
        });

    } catch (error) {
        console.error('Erro no forgotPassword:', error);
        if (!res.headersSent) {
            res.status(500).json({ erro: 'Erro ao processar solicitação' });
        }
    }
};

const resetPassword = async (req, res) => {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
        return res.status(400).json({ erro: 'Token e nova senha são obrigatórios' });
    }

    try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const result = await pool.query(
            `SELECT id, pessoa_id FROM password_reset_token
             WHERE token_hash = $1 AND expires_at > NOW()`,
            [tokenHash]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ erro: 'Token inválido ou expirado' });
        }

        const { id: tokenId, pessoa_id: userId } = result.rows[0];

        const newHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

        await pool.query('UPDATE pessoa SET senha = $1 WHERE id = $2', [
            newHash,
            userId,
        ]);

        await pool.query('DELETE FROM password_reset_token WHERE id = $1', [tokenId]);

        await pool.query('DELETE FROM refresh_token WHERE pessoa_id = $1', [userId]);

        return res.status(200).json({ mensagem: 'Senha redefinida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao redefinir senha' });
    }
};

module.exports = {
    register,
    login,
    logout,
    refresh,
    forgotPassword,
    resetPassword,
};