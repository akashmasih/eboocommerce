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

export const productRepository = {
  /**
   * Find all products with filters and pagination
   */
  findAll: async (query: ProductQuery) => {
    const where: Prisma.ProductWhereInput = {};
    
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.sellerId) where.sellerId = query.sellerId;
    if (query.status) where.status = query.status;
    
    // Price range filter
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
    }
    
    // Stock filter
    if (query.inStock === true) {
      where.stock = { gt: 0 };
    }
    
    // Text search (PostgreSQL full-text search)
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } }
      ];
    }
    
    return prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: query.offset,
      take: query.limit,
      include: { category: true }
    });
  },

  /**
   * Count products matching query
   */
  count: async (query: Omit<ProductQuery, 'limit' | 'offset'>) => {
    const where: Prisma.ProductWhereInput = {};
    
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.sellerId) where.sellerId = query.sellerId;
    if (query.status) where.status = query.status;
    
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
    }
    
    if (query.inStock === true) {
      where.stock = { gt: 0 };
    }
    
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } }
      ];
    }
    
    return prisma.product.count({ where });
  },

  /**
   * Find product by ID
   */
  findById: (id: string) => 
    prisma.product.findUnique({ 
      where: { id },
      include: { category: true }
    }),

  /**
   * Find product by SKU
   */
  findBySku: (sku: string) => 
    prisma.product.findUnique({ 
      where: { sku },
      include: { category: true }
    }),

  /**
   * Find product by slug
   */
  findBySlug: (slug: string) => 
    prisma.product.findUnique({ 
      where: { slug },
      include: { category: true }
    }),

  /**
   * Find products by seller
   */
  findBySeller: (sellerId: string, limit: number, offset: number) => 
    prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: { category: true }
    }),

  /**
   * Create new product
   */
  create: (data: Prisma.ProductCreateInput) => 
    prisma.product.create({ 
      data,
      include: { category: true }
    }),

  /**
   * Update product
   */
  update: (id: string, data: Prisma.ProductUpdateInput) => 
    prisma.product.update({
      where: { id },
      data,
      include: { category: true }
    }),

  /**
   * Delete product
   */
  remove: (id: string) => 
    prisma.product.delete({ where: { id } }),

  /**
   * Update stock
   */
  updateStock: async (id: string, quantity: number) => {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Product not found');
    
    return prisma.product.update({
      where: { id },
      data: { stock: product.stock + quantity },
      include: { category: true }
    });
  },

  /**
   * Find products by category with count
   */
  findByCategory: async (categoryId: string, limit: number, offset: number) => {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { categoryId, status: 'active' },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: { category: true }
      }),
      prisma.product.count({ 
        where: { categoryId, status: 'active' }
      })
    ]);
    
    return { products, total };
  }
};
