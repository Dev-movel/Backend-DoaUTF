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

    // Verifica se email já existe (verificado ou não)
    const existente = await pool.query(
        'SELECT id, is_verified FROM pessoa WHERE email = $1',
        [email]
    );
    if (existente.rowCount > 0) {
        const usuario = existente.rows[0];
        if (usuario.is_verified) {
            return res.status(400).json({ erro: 'E-mail já cadastrado' });
        }
        // Usuário não verificado existe - pode reenviar código
        return res.status(400).json({ 
            erro: 'E-mail já cadastrado. Verifique seu e-mail para confirmar sua conta ou solicite um novo código.' 
        });
    }

    try {
        const hash = await bcrypt.hash(senha, SALT_ROUNDS);
        
        // Cria usuário com is_verified = false
        const result = await pool.query(
            'INSERT INTO pessoa (nome, email, senha, data_nascimento, is_verified) VALUES ($1, $2, $3, $4, FALSE) RETURNING id, nome, email',
            [nome, email, hash, data_nascimento ?? null]
        );
        
        const userId = result.rows[0].id;
        
        // Gera código de 6 dígitos
        const codigo = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        
        // Salva código no banco
        await pool.query(
            'INSERT INTO email_verification (pessoa_id, codigo, expires_at) VALUES ($1, $2, $3)',
            [userId, codigo, expiresAt]
        );

        // Envia e-mail (fire-and-forget - não bloqueia resposta)
        const { sendVerificationCode } = require('../config/mailer');
        sendVerificationCode(email, codigo).catch(err => {
            console.error(`Falha ao enviar código de verificação para ${email}:`, err.message);
        });

        console.log(`Código de verificação gerado para ${email}: ${codigo}`);

        res.status(201).json({ 
            mensagem: 'Usuário cadastrado. Verifique seu e-mail institucional para obter o código de acesso.',
            requireVerification: true,
            expiresIn: 900
        });
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
            'SELECT id, senha, is_verified FROM pessoa WHERE email = $1',
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ erro: INVALID_MSG });
        }

        const user = result.rows[0];

        // Verifica se o e-mail foi verificado
        if (!user.is_verified) {
            return res.status(403).json({ 
                erro: 'E-mail não verificado. Verifique seu e-mail institucional ou solicite um novo código.',
                requireVerification: true
            });
        }

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

        const resetLink = `${process.env.FRONTEND_URL}/#/reset-password?token=${rawToken}`;

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

/**
 * Verifica o código de e-mail e libera o acesso do usuário.
 * POST /auth/verify-email
 */
const verifyEmail = async (req, res) => {
    const { email, codigo } = req.body;

    if (!email || !codigo) {
        return res.status(400).json({ erro: 'E-mail e código são obrigatórios' });
    }

    try {
        // Busca usuário pelo email
        const userResult = await pool.query(
            'SELECT id, is_verified FROM pessoa WHERE email = $1',
            [email]
        );

        if (userResult.rowCount === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        const user = userResult.rows[0];

        if (user.is_verified) {
            return res.status(400).json({ erro: 'E-mail já verificado. Faça login normalmente.' });
        }

        // Busca código de verificação válido
        const codeResult = await pool.query(
            `SELECT id FROM email_verification 
             WHERE pessoa_id = $1 AND codigo = $2 AND expires_at > NOW()`,
            [user.id, codigo]
        );

        if (codeResult.rowCount === 0) {
            return res.status(400).json({ erro: 'Código inválido ou expirado' });
        }

        // Marca usuário como verificado
        await pool.query(
            'UPDATE pessoa SET is_verified = TRUE WHERE id = $1',
            [user.id]
        );

        // Remove código usado
        await pool.query(
            'DELETE FROM email_verification WHERE pessoa_id = $1',
            [user.id]
        );

        // Gera tokens de acesso
        const { accessToken, refreshToken } = generateTokens(user.id);

        const refreshHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
        await pool.query(
            `INSERT INTO refresh_token (pessoa_id, token_hash, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
            [user.id, refreshHash]
        );

        console.log(`E-mail verificado para: ${email}`);
        return res.status(200).json({ 
            accessToken, 
            refreshToken,
            mensagem: 'E-mail verificado com sucesso!' 
        });
    } catch (error) {
        console.error('Erro na verificação de e-mail:', error);
        res.status(500).json({ erro: 'Erro ao verificar e-mail' });
    }
};

/**
 * Reenvia o código de verificação para o e-mail do usuário.
 * POST /auth/resend-verification
 */
const resendVerificationCode = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ erro: 'E-mail é obrigatório' });
    }

    try {
        // Busca usuário não verificado
        const userResult = await pool.query(
            'SELECT id, is_verified FROM pessoa WHERE email = $1',
            [email]
        );

        if (userResult.rowCount === 0) {
            return res.status(404).json({ erro: 'Nenhum cadastro pendente para este e-mail' });
        }

        const user = userResult.rows[0];

        if (user.is_verified) {
            return res.status(400).json({ erro: 'Este e-mail já está verificado. Faça login normalmente.' });
        }

        const userId = user.id;

        // Remove códigos antigos
        await pool.query(
            'DELETE FROM email_verification WHERE pessoa_id = $1',
            [userId]
        );

        // Gera novo código
        const novoCodigo = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Salva novo código
        await pool.query(
            'INSERT INTO email_verification (pessoa_id, codigo, expires_at) VALUES ($1, $2, $3)',
            [userId, novoCodigo, expiresAt]
        );

        // Envia e-mail
        const { sendVerificationCode } = require('../config/mailer');
        sendVerificationCode(email, novoCodigo).catch(err => {
            console.error(`Falha ao reenviar código para ${email}:`, err.message);
        });

        console.log(`Novo código de verificação reenviado para ${email}`);
        return res.status(200).json({ 
            mensagem: 'Novo código enviado para seu e-mail',
            expiresIn: 900
        });
    } catch (error) {
        console.error('Erro ao reenviar código:', error);
        res.status(500).json({ erro: 'Erro ao reenviar código de verificação' });
    }
};

module.exports = {
    register,
    login,
    logout,
    refresh,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationCode,
};