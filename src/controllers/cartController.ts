import { Request, Response, NextFunction } from 'express';
import { cartService } from '../services/cartService';

/**
 * Cart Controller - HTTP Request/Response Layer
 * Handles HTTP requests, extracts data, calls service, returns responses
 */
export const cartController = {
  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId ?? req.query.userId?.toString();
      const guestId = req.query.guestId?.toString();
      const cart = await cartService.getCart({
        userId: userId || undefined,
        guestId: guestId || undefined
      });
      res.json(cart);
    } catch (error) {
      next(error);
    }
  },

  add: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, guestId, productId, quantity } = req.body;
      const cart = await cartService.addItem({
        userId,
        guestId,
        productId,
        quantity
      });
      res.status(201).json(cart);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, productId, quantity } = req.body;
      const cart = await cartService.updateItem({
        userId,
        productId,
        quantity
      });
      res.json(cart);
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, productId } = req.body;
      const cart = await cartService.removeItem({
        userId,
        productId
      });
      res.json(cart);
    } catch (error) {
      next(error);
    }
  }
};
