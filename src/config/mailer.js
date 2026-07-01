const nodemailer = require('nodemailer');
require('dotenv').config();

// ── Transporter Gmail SMTP ───────────────────────────────────────────────────
let transporter;

const initTransporter = async () => {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS, // senha de app gerada no Google
        },
    });

    await transporter.verify();
    console.log('✅ Gmail SMTP pronto para envio');
};

const getTransporter = () => {
    if (!transporter) {
        throw new Error('Transporter não inicializado. Chame initTransporter() no startup.');
    }
    return transporter;
};

// ── Envio de redefinição de senha ────────────────────────────────────────────

/**
 * Envia e-mail de recuperação de senha.
 *
 * @param {string} to - E-mail do destinatário
 * @param {string} resetLink - Link para redefinir a senha
 */
const sendPasswordReset = async (to, resetLink) => {
    const info = await getTransporter().sendMail({
        from: process.env.MAIL_FROM || 'DoaUTF <seugmail@gmail.com>',
        to,
        subject: 'Redefinição de Senha - DoaUTF',
        text: `Você solicitou a redefinição da sua senha.\n\nAcesse o link abaixo (válido por 1 hora):\n${resetLink}\n\nSe não foi você, ignore este e-mail.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2D7A1F;">Redefinição de Senha</h2>
                <p>Você solicitou a redefinição da sua senha.</p>
                <p>Clique no botão abaixo para criar uma nova senha:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="
                        display: inline-block;
                        padding: 12px 30px;
                        background: #2D7A1F;
                        color: white;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: bold;
                    ">
                        Redefinir Senha
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    Ou copie e cole este link no seu navegador:<br>
                    <code style="word-break: break-all;">${resetLink}</code>
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    Este link expira em <strong>1 hora</strong>.<br>
                    Se você não solicitou a redefinição de senha, ignore este e-mail.
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    © 2026 DoaUTF. Todos os direitos reservados.
                </p>
            </div>
        `,
    });

    console.log(`E-mail enviado para ${to} — ID: ${info.messageId}`);
    return info;
};

// ── Envio de código de verificação ──────────────────────────────────────────

/**
 * Envia e-mail com código de verificação de 6 dígitos.
 *
 * @param {string} to - E-mail do destinatário
 * @param {string} code - Código de 6 dígitos
 */
const sendVerificationCode = async (to, code) => {
    const info = await getTransporter().sendMail({
        from: process.env.MAIL_FROM || 'DoaUTF <seugmail@gmail.com>',
        to,
        subject: 'Confirme seu e-mail da UTFPR - DoaUTF',
        text: `Bem-vindo ao DoaUTF! Seu código de verificação é: ${code}`,
        html: `
            <div style="font-family: Arial, sans-serif; text-align: center; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2D7A1F;">Bem-vindo ao DoaUTF!</h2>
                <p>Para confirmar seu e-mail institucional, digite o código de 6 dígitos abaixo no aplicativo:</p>
                <div style="margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; background: #EBEBEB; padding: 15px 30px; border-radius: 10px; display: inline-block;">
                        ${code}
                    </span>
                </div>
                <p style="color: #999; font-size: 14px;">Este código expira em <strong>15 minutos</strong>.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    © 2026 DoaUTF. Todos os direitos reservados.
                </p>
            </div>
        `,
    });

    console.log(`Código de verificação enviado para ${to} — ID: ${info.messageId}`);
    return info;
};

// ── Envio de código de resgate de prêmio ────────────────────────────────────

/**
 * Envia e-mail com o código de resgate de prêmio.
 *
 * @param {string} to - E-mail do destinatário
 * @param {string} nomeUsuario - Nome do usuário
 * @param {string} premioNome - Nome do prêmio resgatado
 * @param {string} codigo - Código no formato DOA-XXXXX
 * @param {number} pontosGastos - Pontos debitados
 */
const sendResgateCodigo = async (to, nomeUsuario, premioNome, codigo, pontosGastos) => {
    const info = await getTransporter().sendMail({
        from: process.env.MAIL_FROM || 'DoaUTF <seugmail@gmail.com>',
        to,
        subject: `Resgate confirmado: ${premioNome} — DoaUTF`,
        text: `Olá, ${nomeUsuario}!\n\nSeu resgate foi confirmado.\n\nPrêmio: ${premioNome}\nPontos gastos: ${pontosGastos}\nCódigo: ${codigo}\n\nPara retirar seu prêmio, apresente este código no Bloco E, sala 105.\n\nEquipe DoaUTF`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2D7A1F;">Resgate Confirmado!</h2>
                <p>Olá, <strong>${nomeUsuario}</strong>!</p>
                <p>Seu resgate foi processado com sucesso:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; color: #666;">Prêmio:</td>
                        <td style="padding: 8px; font-weight: bold;">${premioNome}</td>
                    </tr>
                    <tr style="background: #f9f9f9;">
                        <td style="padding: 8px; color: #666;">Pontos gastos:</td>
                        <td style="padding: 8px; font-weight: bold;">${pontosGastos} pts</td>
                    </tr>
                </table>
                <p>Seu código de retirada:</p>
                <div style="text-align: center; margin: 24px 0;">
                    <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2D7A1F; background: #E8F5E2; padding: 14px 28px; border-radius: 10px; display: inline-block;">
                        ${codigo}
                    </span>
                </div>
                <p style="color: #333;">
                    Apresente este código para retirar seu prêmio:<br>
                    <strong>📍 Bloco E, sala 105</strong>
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    Guarde este e-mail — o código é necessário para a retirada.
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    © 2026 DoaUTF. Todos os direitos reservados.
                </p>
            </div>
        `,
    });

    console.log(`E-mail de resgate enviado para ${to} — ID: ${info.messageId}`);
    return info;
};

module.exports = { sendPasswordReset, sendVerificationCode, sendResgateCodigo, initTransporter };