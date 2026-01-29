import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
  image: z.string().url().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sortOrder: z.number().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryParamsSchema = z.object({
  id: z.string().uuid()
});

export const categorySlugParamsSchema = z.object({
  slug: z.string().min(1)
});
