require('dotenv').config();

const app = require('./src/app');
const PORT = process.env.PORT || 3000;

const initDatabase = require('./src/database/initDatabase');
const { initTransporter } = require('./src/config/mailer');

const start = async () => {
  await initDatabase();
  
  try {
    await initTransporter();
  } catch (error) {
    console.warn('⚠️  Aviso: Não foi possível inicializar o sistema de e-mail. Verifique a configuração.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
};

start();