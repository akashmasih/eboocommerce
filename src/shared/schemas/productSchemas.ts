import { z } from 'zod';

const variantSchema = z.object({
  name: z.string(),
  value: z.string(),
  sku: z.string().optional(),
  price: z.number().optional(),
  stock: z.number().optional(),
  image: z.string().url().optional()
});

export const createProductSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  sellerId: z.string().uuid(),
  images: z.array(z.string().url()).optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  variants: z.array(variantSchema).optional(),
  tags: z.array(z.string()).optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional()
  }).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  sellerId: z.string().uuid().optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional()
});

export const productParamsSchema = z.object({
  id: z.string().uuid()
});
