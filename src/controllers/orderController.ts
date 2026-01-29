import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/orderService';

/**
 * Order Controller - HTTP Request/Response Layer
 * Handles HTTP requests, extracts data, calls service, returns responses
 */
export const orderController = {
  checkout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, items } = req.body;
      const order = await orderService.checkout({ userId, items: items || [] });
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  },

  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.getById(req.params.id);
      res.json(order);
    } catch (error) {
      next(error);
    }
  },

  listByUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await orderService.listByUser(req.params.userId);
      res.json(orders);
    } catch (error) {
      next(error);
    }
  },

  cancel: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.cancel(req.params.id);
      res.json(order);
    } catch (error) {
      next(error);
    }
  }
};
