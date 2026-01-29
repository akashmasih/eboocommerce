import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/reviewService';
import { ReviewStatus } from '@prisma/client';

/**
 * Review Controller - HTTP Request/Response Layer
 */
export const reviewController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as ReviewStatus | undefined;
      const reviews = await reviewService.list(req.params.productId, status);
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await reviewService.create(req.body);
      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  },

  moderate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.body.status as ReviewStatus;
      const review = await reviewService.moderate(req.params.id, status);
      res.json(review);
    } catch (error) {
      next(error);
    }
  },

  getAverageRating: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rating = await reviewService.getAverageRating(req.params.productId);
      res.json(rating);
    } catch (error) {
      next(error);
    }
  }
};
