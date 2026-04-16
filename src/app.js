const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const usuarioRoutes = require('./routes/usuarioRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Documentação
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rota Principal
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// Rotas da Aplicação
app.use('/auth', authRoutes);
app.use('/usuarios', usuarioRoutes);

module.exports = app;