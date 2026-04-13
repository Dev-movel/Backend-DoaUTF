const app = require('./src/app');
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📄 Documentação modular disponível em http://localhost:${PORT}/api-docs`);
});
