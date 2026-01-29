import { z } from 'zod';

const variantSchema = z.object({
  name: z.string().min(1), // e.g. "Color", "Size"
  value: z.string().min(1), // e.g. "Red", "Large"
  sku: z.string().optional(),
  price: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  image: z.string().url().optional() // Image URL for this variant (e.g. color swatch, size image)
});

const dimensionsSchema = z.object({
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional()
}).optional();

export const createProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  sellerId: z.string().min(1),
  images: z.array(z.string().url()).optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  stock: z.number().min(0).default(0),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).default('draft'),
  variants: z.array(variantSchema).optional(),
  tags: z.array(z.string()).optional(),
  weight: z.number().min(0).optional(),
  dimensions: dimensionsSchema,
  slug: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const updateProductSchema = createProductSchema.partial().extend({
  sellerId: z.string().min(1).optional() // Allow updating sellerId
});

export const productQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  sellerId: z.string().optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  minPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  inStock: z.string().transform(val => val === 'true').optional()
});

export const productParamsSchema = z.object({
  id: z.string().min(1)
});
