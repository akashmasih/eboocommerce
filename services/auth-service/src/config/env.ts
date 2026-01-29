import { z } from 'zod';
import { loadEnv as loadEnvFromShared } from '../../../../shared/config/env';

type EnvSchema = {
  PORT: string;
  SERVICE_NAME: string;
  LOG_LEVEL?: string;
  REDIS_URL?: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  SSO_ISSUER?: string;
  CORS_ORIGINS?: string;
};

const schema = z.object({
  PORT: z.string(),
  SERVICE_NAME: z.string(),
  LOG_LEVEL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  SSO_ISSUER: z.string().optional(),
  CORS_ORIGINS: z.string().optional()
});

export const env = loadEnvFromShared(schema) as EnvSchema;

