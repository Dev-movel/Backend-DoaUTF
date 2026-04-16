const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

const initTransporter = async () => {
    if (transporter) return transporter;

    if (process.env.MAIL_HOST === 'ethereal') {
        console.log('📧 Criando conta de teste Ethereal...');
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log('Ethereal configurado com sucesso');
            console.log(`Visualize os e-mails em: https://ethereal.email/messages`);
        } catch (error) {
            console.error('Erro ao criar conta Ethereal:', error);
            throw error;
        }
    } else {
        // Para outros serviços (Gmail, SendGrid, etc)
        transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT) || 587,
            secure: process.env.MAIL_SECURE === 'true',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
    }

    return transporter;
};

/**
 * Envia e-mail de recuperação de senha
 * @param {string} to - E-mail do destinatário
 * @param {string} resetLink - Link para redefinir a senha
 */
const sendPasswordReset = async (to, resetLink) => {
    const transporter = await initTransporter();

    const mailOptions = {
        from: `"DoaUTF" <${process.env.MAIL_FROM || 'noreply@doautf.com'}>`,
        to,
        subject: '🔐 Redefinição de Senha - DoaUTF',
        text: `Você solicitou a redefinição da sua senha.\n\nAcesse o link abaixo (válido por 1 hora):\n${resetLink}\n\nSe não foi você, ignore este e-mail.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">🔐 Redefinição de Senha</h2>
                <p>Você solicitou a redefinição da sua senha.</p>
                <p>Clique no botão abaixo para criar uma nova senha:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="
                        display: inline-block;
                        padding: 12px 30px;
                        background: #007bff;
                        color: white;
                        border-radius: 5px;
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
                    ⏰ Este link expira em <strong>1 hora</strong>.<br>
                    Se você não solicitou a redefinição de senha, ignore este e-mail.
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    © 2026 DoaUTF. Todos os direitos reservados.
                </p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`E-mail enviado para ${to}`);
        
        if (process.env.MAIL_HOST === 'ethereal') {
            console.log(`📧 Visualize em: ${nodemailer.getTestMessageUrl(info)}`);
        }
        
        return info;
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        throw new Error('Erro ao enviar e-mail de recuperação');
    }
};

module.exports = { sendPasswordReset, initTransporter };