import { z } from 'zod';

export function loadEnv(schema: z.ZodSchema) {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error('Invalid environment: ' + JSON.stringify(parsed.error.format()));
  }
  return parsed.data;
}
