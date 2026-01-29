import { prisma } from './prisma';
import { ReviewStatus, Prisma } from '@prisma/client';

export const reviewRepository = {
  listByProduct: (productId: string, status?: ReviewStatus) =>
    prisma.review.findMany({
      where: { productId, ...(status && { status }) },
      orderBy: { createdAt: 'desc' }
    }),
  findById: (id: string) => prisma.review.findUnique({ where: { id } }),
  listByUser: (userId: string) =>
    prisma.review.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  create: (data: Prisma.ReviewCreateInput) => prisma.review.create({ data }),
  update: (id: string, data: Prisma.ReviewUpdateInput) =>
    prisma.review.update({ where: { id }, data }),
  moderate: (id: string, status: ReviewStatus) =>
    prisma.review.update({ where: { id }, data: { status } }),
  remove: (id: string) => prisma.review.delete({ where: { id } }),
  getAverageRating: async (productId: string) => {
    const result = await prisma.review.aggregate({
      where: { productId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: { rating: true }
    });
    return { average: result._avg.rating || 0, count: result._count.rating || 0 };
  }
};
