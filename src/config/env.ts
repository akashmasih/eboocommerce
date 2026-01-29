import { z } from 'zod';
import { loadEnv as loadEnvFromShared } from '../shared/config/env';

const schema = z.object({
  PORT: z.string().default('4000'),
  SERVICE_NAME: z.string().default('eboocommerce'),
  LOG_LEVEL: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  SSO_ISSUER: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_PROVIDER: z.string().optional(),
  FRONTEND_URL: z.string().optional()
});

export type Env = z.infer<typeof schema>;
export const env = loadEnvFromShared(schema) as Env;
