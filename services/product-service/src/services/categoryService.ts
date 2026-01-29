import { categoryRepository } from '../repositories/categoryRepository';
import { NotFoundError, BadRequestError } from '../../../../shared/utils/errors';
import { logger } from '../../../../shared/utils/logger';
import { CategoryStatus, Prisma } from '@prisma/client';

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  image?: string;
  status?: CategoryStatus;
  sortOrder?: number;
  metadata?: Record<string, any>;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}

export class CategoryService {
  /**
   * List all categories
   */
  async list(status?: CategoryStatus) {
    return categoryRepository.list(status);
  }

  /**
   * Get category by ID
   */
  async getById(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category');
    }
    return category;
  }

  /**
   * Get category by slug
   */
  async getBySlug(slug: string) {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundError('Category');
    }
    return category;
  }

  /**
   * Get categories by parent
   */
  async getByParent(parentId: string | null) {
    return categoryRepository.findByParent(parentId);
  }

  /**
   * Create category
   */
  async create(input: CreateCategoryInput) {
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Category name is required');
    }

    // Normalize parentId: empty string or whitespace => null (avoids FK violation)
    const parentId = input.parentId?.trim() || null;

    // Generate unique slug from name (always auto-generated, ignore if provided)
    const baseSlug = this.generateSlug(input.name);
    const slug = await this.generateUniqueSlug(baseSlug);

    // Validate parent exists if provided
    if (parentId) {
      const parent = await categoryRepository.findById(parentId);
      if (!parent) {
        throw new NotFoundError('Parent category');
      }
    }

    // Remove slug from input since it's always auto-generated; use normalized parentId
    const { slug: _, parentId: _pid, ...rest } = input;
    const categoryData = {
      ...rest,
      parentId,
      slug,
      status: input.status || 'active',
      sortOrder: input.sortOrder || 0
    };

    const category = await categoryRepository.create(categoryData);
    logger.info({ categoryId: category.id }, 'Category created');
    return category;
  }

  /**
   * Update category
   */
  async update(id: string, input: UpdateCategoryInput) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Category');
    }

    // Generate unique slug if name is updated (always auto-generated from new name)
    let slug = existing.slug;
    if (input.name && input.name !== existing.name) {
      const baseSlug = this.generateSlug(input.name);
      slug = await this.generateUniqueSlug(baseSlug, id); // Pass current id to exclude it from uniqueness check
    }

    // Normalize parentId: empty string or whitespace => null
    const parentId = input.parentId !== undefined
      ? (input.parentId?.trim() || null)
      : undefined;

    // Validate parent exists if provided
    if (parentId !== undefined && parentId !== existing.parentId) {
      if (parentId === id) {
        throw new BadRequestError('Category cannot be its own parent');
      }
      if (parentId) {
        const parent = await categoryRepository.findById(parentId);
        if (!parent) {
          throw new NotFoundError('Parent category');
        }
      }
    }

    // Remove slug from input since it's always auto-generated from name; use normalized parentId
    const { slug: _, parentId: _pid, ...rest } = input;
    const updateData: Prisma.CategoryUpdateInput = {
      ...rest,
      ...(slug && { slug }),
      ...(parentId !== undefined && { parentId })
    };

    const category = await categoryRepository.update(id, updateData);
    logger.info({ categoryId: id }, 'Category updated');
    return category;
  }

  /**
   * Delete category
   */
  async delete(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category');
    }

    // Check if category has children
    const hasChildren = await categoryRepository.hasChildren(id);
    if (hasChildren) {
      throw new BadRequestError('Cannot delete category with child categories');
    }

    await categoryRepository.remove(id);
    logger.info({ categoryId: id }, 'Category deleted');
  }

  /**
   * Generate URL-friendly slug from name
   */
  private generateSlug(name: string): string {
    return name
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
      const existing = await categoryRepository.findBySlug(slug);
      
      // If no conflict, or if the conflict is the same category (for updates), use this slug
      if (!existing || (excludeId && existing.id === excludeId)) {
        return slug;
      }
      
      // Append counter to make it unique
      slug = `${baseSlug}-${counter}`;
      counter++;
      
      // Safety check to prevent infinite loop
      if (counter > 1000) {
        throw new BadRequestError('Unable to generate unique slug. Please try a different name.');
      }
    }
  }
}

// Export singleton instance
export const categoryService = new CategoryService();
