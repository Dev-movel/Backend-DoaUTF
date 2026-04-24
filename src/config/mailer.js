const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envia e-mail de recuperação de senha via Resend (HTTPS, porta 443).
 * Funciona em qualquer rede, incluindo redes universitárias que bloqueiam SMTP.
 *
 * @param {string} to - E-mail do destinatário
 * @param {string} resetLink - Link para redefinir a senha
 */
const sendPasswordReset = async (to, resetLink) => {
    const { data, error } = await resend.emails.send({
        from: process.env.MAIL_FROM || 'DoaUTF <onboarding@resend.dev>',
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

    if (error) {
        console.error('Resend error:', error);
        throw new Error(`Falha ao enviar e-mail: ${error.message}`);
    }

    console.log(`E-mail enviado para ${to} — ID: ${data.id}`);
    return data;
};

/**
 * Envia e-mail com código de verificação de 6 dígitos.
 * Usado no cadastro de novos usuários.
 *
 * @param {string} to - E-mail do destinatário
 * @param {string} code - Código de 6 dígitos
 */
const sendVerificationCode = async (to, code) => {
    const { data, error } = await resend.emails.send({
        from: process.env.MAIL_FROM || 'DoaUTF <onboarding@resend.dev>',
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

    if (error) {
        console.error('Resend error (Verification):', error);
        throw new Error(`Falha ao enviar e-mail: ${error.message}`);
    }

    console.log(`Código de verificação enviado para ${to} — ID: ${data.id}`);
    return data;
};

const initTransporter = async () => {};

module.exports = { sendPasswordReset, sendVerificationCode, initTransporter };