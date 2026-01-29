import { prisma } from './prisma';
import { ReviewStatus, Prisma } from '@prisma/client';

export const reviewRepository = {
  /**
   * List reviews by product
   */
  listByProduct: (productId: string, status?: ReviewStatus) => 
    prisma.review.findMany({
      where: { 
        productId,
        ...(status && { status })
      },
      orderBy: { createdAt: 'desc' }
    }),

  /**
   * Get review by ID
   */
  findById: (id: string) => 
    prisma.review.findUnique({ where: { id } }),

  /**
   * List reviews by user
   */
  listByUser: (userId: string) => 
    prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    }),

  /**
   * Create review
   */
  create: (data: Prisma.ReviewCreateInput) => 
    prisma.review.create({ data }),

  /**
   * Update review
   */
  update: (id: string, data: Prisma.ReviewUpdateInput) => 
    prisma.review.update({
      where: { id },
      data
    }),

  /**
   * Moderate review (update status)
   */
  moderate: (id: string, status: ReviewStatus) => 
    prisma.review.update({
      where: { id },
      data: { status }
    }),

  /**
   * Delete review
   */
  remove: (id: string) => 
    prisma.review.delete({ where: { id } }),

  /**
   * Get average rating for product
   */
  getAverageRating: async (productId: string) => {
    const result = await prisma.review.aggregate({
      where: { 
        productId,
        status: 'APPROVED'
      },
      _avg: { rating: true },
      _count: { rating: true }
    });
    
    return {
      average: result._avg.rating || 0,
      count: result._count.rating || 0
    };
  }
};
