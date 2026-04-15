const app = require('./src/app');
const PORT = 6125;

const initDatabase = require('./src/database/initDatabase');

const start = async () => {
  await initDatabase();

  app.listen(PORT, () => {
    console.log('🚀 Servidor rodando');
  });
};

start();