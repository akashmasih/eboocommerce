import { z } from 'zod';
import { loadEnv as loadEnvFromShared } from '../../../../shared/config/env';

type EnvSchema = {
  PORT: string;
  SERVICE_NAME: string;
  LOG_LEVEL?: string;
  DATABASE_URL: string; // Required for Prisma services
  RABBITMQ_URL?: string;
};

const schema = z.object({
  PORT: z.string(),
  SERVICE_NAME: z.string(),
  LOG_LEVEL: z.string().optional(),
  DATABASE_URL: z.string(), // Required for Prisma services
  RABBITMQ_URL: z.string().optional()
});

export const env = loadEnvFromShared(schema) as EnvSchema;

