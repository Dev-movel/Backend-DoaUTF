const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const usuarioRoutes = require('./routes/usuarioRoutes');
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const solicitacaoRoutes = require('./routes/solicitacaoRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Arquivos de upload
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Documentação
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rota Principal
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// Rotas da Aplicação
app.use('/auth', authRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/itens', itemRoutes);
app.use('/categorias', categoriaRoutes);
app.use('/solicitacoes', solicitacaoRoutes);

module.exports = app;
