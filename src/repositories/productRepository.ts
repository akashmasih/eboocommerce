import { prisma } from './prisma';
import { ProductStatus, Prisma } from '@prisma/client';

export interface ProductQuery {
  limit: number;
  offset: number;
  search?: string;
  categoryId?: string;
  sellerId?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

function buildWhere(query: Omit<ProductQuery, 'limit' | 'offset'>): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.sellerId) where.sellerId = query.sellerId;
  if (query.status) where.status = query.status;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {};
    if (query.minPrice !== undefined) (where.price as any).gte = query.minPrice;
    if (query.maxPrice !== undefined) (where.price as any).lte = query.maxPrice;
  }
  if (query.inStock === true) where.stock = { gt: 0 };
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { tags: { has: query.search } }
    ];
  }
  return where;
}

export const productRepository = {
  findAll: async (query: ProductQuery) =>
    prisma.product.findMany({
      where: buildWhere(query),
      orderBy: { createdAt: 'desc' },
      skip: query.offset,
      take: query.limit,
      include: { category: true }
    }),
  count: async (query: Omit<ProductQuery, 'limit' | 'offset'>) =>
    prisma.product.count({ where: buildWhere(query) }),
  findById: (id: string) =>
    prisma.product.findUnique({ where: { id }, include: { category: true } }),
  findBySku: (sku: string) =>
    prisma.product.findUnique({ where: { sku }, include: { category: true } }),
  findBySlug: (slug: string) =>
    prisma.product.findUnique({ where: { slug }, include: { category: true } }),
  findBySeller: (sellerId: string, limit: number, offset: number) =>
    prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: { category: true }
    }),
  create: (data: Prisma.ProductCreateInput) =>
    prisma.product.create({ data, include: { category: true } }),
  update: (id: string, data: Prisma.ProductUpdateInput) =>
    prisma.product.update({ where: { id }, data, include: { category: true } }),
  remove: (id: string) => prisma.product.delete({ where: { id } }),
  updateStock: async (id: string, quantity: number) => {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Product not found');
    return prisma.product.update({
      where: { id },
      data: { stock: product.stock + quantity },
      include: { category: true }
    });
  }
};
