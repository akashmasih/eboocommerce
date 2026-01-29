import { z } from 'zod';
import { loadEnv as loadEnvFromShared } from '../../../../shared/config/env';

type EnvSchema = {
  PORT: string;
  SERVICE_NAME: string;
  LOG_LEVEL?: string;
  REDIS_URL?: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
};

const schema = z.object({
  PORT: z.string(),
  SERVICE_NAME: z.string(),
  LOG_LEVEL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required for product-service'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required for authentication'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required for image uploads'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required for image uploads'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required for image uploads')
});

export const env = loadEnvFromShared(schema) as EnvSchema;

