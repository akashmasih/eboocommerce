import { reviewRepository } from '../repositories/reviewRepository';
import { ValidationError, NotFoundError } from '../../../../shared/utils/errors';
import { ReviewStatus } from '@prisma/client';

export interface CreateReviewInput {
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
}

/**
 * Review Service - Business Logic Layer
 */
export class ReviewService {
  async list(productId: string, status?: ReviewStatus) {
    if (!productId) {
      throw new ValidationError('ProductId is required');
    }
    return reviewRepository.listByProduct(productId, status);
  }

  async create(input: CreateReviewInput) {
    // Business validation
    if (!input.productId || !input.userId) {
      throw new ValidationError('ProductId and UserId are required');
    }
    if (input.rating < 1 || input.rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    // Transform data
    const data = {
      productId: input.productId,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment,
      status: 'PENDING' as ReviewStatus // New reviews need moderation
    };

    return reviewRepository.create(data);
  }

  async moderate(id: string, status: ReviewStatus) {
    if (!id) {
      throw new ValidationError('Review ID is required');
    }
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new ValidationError('Status must be APPROVED or REJECTED');
    }

    const review = await reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundError('Review');
    }

    return reviewRepository.moderate(id, status);
  }

  async getAverageRating(productId: string) {
    if (!productId) {
      throw new ValidationError('ProductId is required');
    }
    return reviewRepository.getAverageRating(productId);
  }
}

// Export singleton instance
export const reviewService = new ReviewService();
