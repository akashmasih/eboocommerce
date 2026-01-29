import { prisma } from './prisma';
import { CategoryStatus, Prisma } from '@prisma/client';

export const categoryRepository = {
  /**
   * List all categories
   */
  list: (status?: CategoryStatus) => {
    const where: Prisma.CategoryWhereInput = {};
    if (status) where.status = status;
    
    return prisma.category.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      include: { parent: true }
    });
  },

  /**
   * Get category by ID
   */
  findById: (id: string) => 
    prisma.category.findUnique({ 
      where: { id },
      include: { parent: true, children: true }
    }),

  /**
   * Get category by slug
   */
  findBySlug: (slug: string) => 
    prisma.category.findUnique({ 
      where: { slug },
      include: { parent: true, children: true }
    }),

  /**
   * Get categories by parent
   */
  findByParent: (parentId: string | null) => {
    const where: Prisma.CategoryWhereInput = {};
    if (parentId === null) {
      where.parentId = null;
    } else {
      where.parentId = parentId;
    }
    
    return prisma.category.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      include: { parent: true }
    });
  },

  /**
   * Create category
   */
  create: (data: Prisma.CategoryCreateInput) => 
    prisma.category.create({ 
      data,
      include: { parent: true }
    }),

  /**
   * Update category
   */
  update: (id: string, data: Prisma.CategoryUpdateInput) => 
    prisma.category.update({
      where: { id },
      data,
      include: { parent: true, children: true }
    }),

  /**
   * Delete category
   */
  remove: (id: string) => 
    prisma.category.delete({ where: { id } }),

  /**
   * Check if category has children
   */
  hasChildren: async (id: string) => {
    const count = await prisma.category.count({ 
      where: { parentId: id }
    });
    return count > 0;
  }
};
