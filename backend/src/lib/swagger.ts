import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const definition = {
  openapi: '3.0.0',
  info: {
    title: 'FisioManager API',
    version: '1.0.0',
    description: 'API REST de FisioManager — gestión de pacientes, rutinas, sesiones, citas y planes de tratamiento.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
};

const toGlobPath = (p: string) => p.split(path.sep).join('/');

const options: swaggerJsdoc.Options = {
  definition,
  apis: [
    toGlobPath(path.join(__dirname, '../routes/*.ts')),
    toGlobPath(path.join(__dirname, '../routes/*.js')),
  ],
};

const spec = swaggerJsdoc(options);

export function mountApiDocs(app: Express): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
  app.get('/api/docs.json', (_req, res) => res.json(spec));
}
