import swaggerJsdoc from 'swagger-jsdoc';
import { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: `${process.env.SERVICE_NAME || 'Service'} API`,
      version: '1.0.0',
      description: `API documentation for ${process.env.SERVICE_NAME || 'Service'}`,
      contact: {
        name: 'E-boo Platform',
        email: 'support@eboo.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' }
              }
            }
          }
        }
      }
    },
    tags: []
  },
  apis: [
    path.join(process.cwd(), 'src/routes/**/*.ts'),
    path.join(process.cwd(), 'src/controllers/**/*.ts')
  ]
};

export function setupSwagger(app: any, serviceName: string) {
  const swaggerSpec = swaggerJsdoc({
    ...options,
    definition: {
      ...options.definition,
      info: {
        ...options.definition.info,
        title: `${serviceName} API`,
        description: `API documentation for ${serviceName}. Auto-generated from route annotations.`
      }
    }
  });

  // Swagger JSON endpoint
  app.get('/api/docs/swagger.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use('/api/docs', swaggerUi.serve);
  app.get('/api/docs', swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: `${serviceName} API Documentation`,
    swaggerOptions: {
      persistAuthorization: true
    }
  }));
}

export const swaggerSchemas = {
  Error: {
    type: 'object',
    properties: {
      error: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object' }
        }
      }
    }
  },
  HealthCheck: {
    type: 'object',
    properties: {
      status: { type: 'string', example: 'ok' },
      service: { type: 'string' }
    }
  }
};
