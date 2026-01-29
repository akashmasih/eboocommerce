import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import router from './routes';
import { requestTracing } from '../../../shared/utils/tracing';
import { logger } from '../../../shared/utils/logger';
import { errorHandler } from '../../../shared/middleware/errorHandler';
import { setupGracefulShutdown } from '../../../shared/utils/gracefulShutdown';
import { setupSwagger } from '../../../shared/utils/swagger';
import { env } from './config/env';
import { prisma } from './repositories/prisma';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(requestTracing);

// Setup Swagger documentation
setupSwagger(app, 'product-service');
app.use('/api', router);
app.use(errorHandler);

const port = env.PORT || 4002;

// Connect to PostgreSQL via Prisma
prisma.$connect()
  .then(() => {
    logger.info('Connected to PostgreSQL');
    const server = app.listen(port, () => {
      logger.info(`Service ${env.SERVICE_NAME} listening on port ${port}`);
      logger.info(`API Documentation available at http://localhost:${port}/api/docs`);
    });
    setupGracefulShutdown(server, async () => {
      await prisma.$disconnect();
      logger.info('PostgreSQL connection closed');
    });
  })
  .catch((error) => {
    logger.error({ error }, 'Failed to connect to PostgreSQL');
    process.exit(1);
  });