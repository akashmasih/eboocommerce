import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  image: z.string().url().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  sortOrder: z.number().int().min(0).default(0),
  metadata: z.record(z.unknown()).optional()
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryParamsSchema = z.object({
  id: z.string().min(1)
});

export const categorySlugParamsSchema = z.object({
  slug: z.string().min(1)
});
