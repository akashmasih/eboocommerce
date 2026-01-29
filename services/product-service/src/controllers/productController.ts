import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/productService';

/**
 * Product Controller - HTTP Request/Response Layer
 * Handles HTTP requests, extracts data, calls service, returns responses
 */
export const productController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Number(req.query.limit || 20);
      const offset = Number(req.query.offset || 0);
      const search = req.query.search?.toString();
      const categoryId = req.query.categoryId?.toString();
      const sellerId = req.query.sellerId?.toString();
      const status = req.query.status?.toString() as any;
      const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
      const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
      const inStock = req.query.inStock === 'true';

      const result = await productService.list({ 
        limit, 
        offset, 
        search, 
        categoryId,
        sellerId,
        status,
        minPrice,
        maxPrice,
        inStock
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await productService.getById(req.params.id);
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  getBySlug: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await productService.getBySlug(req.params.slug);
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await productService.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await productService.update(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await productService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  updateStock: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quantity = Number(req.body.quantity);
      if (isNaN(quantity)) {
        return res.status(400).json({ error: 'Quantity must be a number' });
      }
      const item = await productService.updateStock(req.params.id, quantity);
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  getBySeller: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sellerId = req.params.sellerId;
      const limit = Number(req.query.limit || 20);
      const offset = Number(req.query.offset || 0);
      const result = await productService.getBySeller(sellerId, limit, offset);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};
