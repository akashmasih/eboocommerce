import { productRepository, ProductQuery } from '../repositories/productRepository';
import { NotFoundError, BadRequestError } from '../shared/utils/errors';
import { logger } from '../shared/utils/logger';
import { ProductStatus } from '@prisma/client';

export interface ListProductsInput extends ProductQuery {}

export interface CreateProductInput {
  title: string;
  description?: string;
  sku?: string;
  categoryId?: string;
  sellerId: string;
  images?: string[];
  price: number;
  compareAtPrice?: number;
  cost?: number;
  stock?: number;
  status?: ProductStatus;
  variants?: Array<{
    name: string;
    value: string;
    sku?: string;
    price?: number;
    stock?: number;
    image?: string; // Image URL for this variant (e.g. color, size)
  }>;
  tags?: string[];
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  metadata?: Record<string, any>;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

/**
 * Product Service - Business Logic Layer
 * Handles product business logic, validation, and data transformation
 */
export class ProductService {
  /**
   * List products with pagination and filters
   */
  async list(input: ListProductsInput) {
    // Business logic: validate pagination
    if (input.limit < 1 || input.limit > 100) {
      input.limit = 20; // Default limit
    }
    if (input.offset < 0) {
      input.offset = 0;
    }

    // Call repository
    const products = await productRepository.findAll(input);
    const total = await productRepository.count(input);

    return {
      items: products,
      pagination: {
        total,
        limit: input.limit,
        offset: input.offset,
        hasMore: input.offset + input.limit < total
      }
    };
  }

  /**
   * Get product by ID
   */
  async getById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }
    return product;
  }

  /**
   * Get product by slug
   */
  async getBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) {
      throw new NotFoundError('Product');
    }
    return product;
  }

  /**
   * Create new product
   */
  async create(input: CreateProductInput) {
    // Business validation
    if (!input.title || input.title.trim().length === 0) {
      throw new BadRequestError('Title is required');
    }

    if (input.price < 0) {
      throw new BadRequestError('Price must be non-negative');
    }

    // Check if SKU already exists
    if (input.sku) {
      const existing = await productRepository.findBySku(input.sku);
      if (existing) {
        throw new BadRequestError('SKU already exists');
      }
    }

    // Generate unique slug from title (always auto-generated, ignore if provided)
    const baseSlug = this.generateSlug(input.title);
    const slug = await this.generateUniqueSlug(baseSlug);

    // Transform data (Prisma handles timestamps automatically)
    // Remove slug from input since it's always auto-generated
    const { slug: _, ...inputWithoutSlug } = input;
    const productData = {
      ...inputWithoutSlug,
      slug,
      stock: input.stock ?? 0,
      status: (input.status ?? ProductStatus.draft)
    };

    // Call repository
    const product = await productRepository.create(productData);
    logger.info({ productId: product.id, sellerId: input.sellerId }, 'Product created');
    
    return product;
  }

  /**
   * Update product
   */
  async update(id: string, input: UpdateProductInput) {
    // Check if product exists
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Product');
    }

    // Validate price if provided
    if (input.price !== undefined && input.price < 0) {
      throw new BadRequestError('Price must be non-negative');
    }

    // Check SKU uniqueness if updating
    if (input.sku && input.sku !== existing.sku) {
      const existingSku = await productRepository.findBySku(input.sku);
      if (existingSku) {
        throw new BadRequestError('SKU already exists');
      }
    }

    // Generate unique slug if title is updated (always auto-generated from new title)
    let slug = existing.slug;
    if (input.title && input.title !== existing.title) {
      const baseSlug = this.generateSlug(input.title);
      slug = await this.generateUniqueSlug(baseSlug, id); // Pass current id to exclude it from uniqueness check
    }

    // Transform data (Prisma handles updatedAt automatically)
    // Remove slug from input since it's always auto-generated from title
    const { slug: _, ...inputWithoutSlug } = input;
    const updateData = {
      ...inputWithoutSlug,
      ...(slug && { slug }),
      ...(input.status && { status: input.status })
    };

    // Call repository
    const product = await productRepository.update(id, updateData);
    logger.info({ productId: id }, 'Product updated');
    
    return product;
  }

  /**
   * Delete product
   */
  async delete(id: string) {
    // Check if product exists
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }

    // Call repository
    await productRepository.remove(id);
    logger.info({ productId: id }, 'Product deleted');
  }

  /**
   * Update product stock
   */
  async updateStock(id: string, quantity: number) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }

    const currentStock = product.stock || 0;
    const newStock = currentStock + quantity;

    if (newStock < 0) {
      throw new BadRequestError('Insufficient stock');
    }

    return productRepository.updateStock(id, quantity);
  }

  /**
   * Get products by seller
   */
  async getBySeller(sellerId: string, limit: number = 20, offset: number = 0) {
    if (limit < 1 || limit > 100) limit = 20;
    if (offset < 0) offset = 0;

    const products = await productRepository.findBySeller(sellerId, limit, offset);
    const total = await productRepository.count({ sellerId });

    return {
      items: products,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Generate a unique slug by appending numbers if conflicts exist
   */
  private async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existing = await productRepository.findBySlug(slug);
      
      // If no conflict, or if the conflict is the same product (for updates), use this slug
      if (!existing || (excludeId && existing.id === excludeId)) {
        return slug;
      }
      
      // Append counter to make it unique
      slug = `${baseSlug}-${counter}`;
      counter++;
      
      // Safety check to prevent infinite loop
      if (counter > 1000) {
        throw new BadRequestError('Unable to generate unique slug. Please try a different title.');
      }
    }
  }
}

// Export singleton instance
export const productService = new ProductService();
