const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0', 
    info: {
      title: 'API de Usuários',
      version: '1.0.0',
      description: 'Documentação Exemplo Backend',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor Local',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticação. Obtenha-o pelo endpoint /auth/login',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;