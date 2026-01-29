import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/categoryService';

export const categoryController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status?.toString();
      const items = await categoryService.list(status);
      res.json(items);
    } catch (error) {
      next(error);
    }
  },

  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await categoryService.getById(req.params.id);
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  getBySlug: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await categoryService.getBySlug(req.params.slug);
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  getByParent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parentId = req.query.parentId === 'null' ? null : req.query.parentId?.toString() || null;
      const items = await categoryService.getByParent(parentId);
      res.json(items);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await categoryService.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await categoryService.update(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await categoryService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
