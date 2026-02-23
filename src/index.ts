import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import router from './routes';
import { requestTracing } from './shared/utils/tracing';
import { logger } from './shared/utils/logger';
import { errorHandler } from './shared/middleware/errorHandler';
import { setupGracefulShutdown } from './shared/utils/gracefulShutdown';
import { setupSwagger } from './shared/utils/swagger';
import { env } from './config/env';
import { prisma } from './repositories/prisma';

const corsOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : undefined;

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(cors({ origin: corsOrigins ?? true, credentials: true }));
app.use(helmet());
app.use(morgan('combined'));
app.use(requestTracing);

setupSwagger(app, 'eboocommerce');
app.use('/api', router);

app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `${req.method} ${req.path} not found`,
      hint: `Did you mean ${req.method} /api${req.path}?`
    }
  });
});

app.use(errorHandler);

const port = env.PORT || 4000;

prisma.$connect()
  .then(() => {
    logger.info('Connected to PostgreSQL');
    const server = app.listen(port, () => {
      logger.info(`${env.SERVICE_NAME} listening on port ${port}`);
      logger.info(`API docs: http://localhost:${port}/api/docs`);
    });
    setupGracefulShutdown(server, async () => {
      await prisma.$disconnect();
      logger.info('PostgreSQL connection closed');
    });
  })
  .catch((error: any) => {
    logger.error(
      {
        message: error?.message,
        code: error?.code,
        cause: error?.cause?.message,
        stack: error?.stack
      },
      'Failed to connect to PostgreSQL'
    );
    console.error('Connection error:', error?.message || error);
    if (error?.message?.includes('certificate') || error?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      console.error('Tip: Set DATABASE_SSL_INSECURE=true if the DB uses a self-signed certificate.');
    }
    process.exit(1);
  });
