const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Profile API',
      version: '1.0.0',
      description: 'API for managing user and admin profiles.',
    },
    servers: [
      {
        url: 'http://localhost:3004',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;