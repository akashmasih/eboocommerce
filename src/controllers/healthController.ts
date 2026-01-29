import { Request, Response } from 'express';
import { prisma } from '../repositories/prisma';

export const healthController = {
  status: (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: process.env.SERVICE_NAME });
  },

  readiness: async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready', service: process.env.SERVICE_NAME });
    } catch (error) {
      res.status(503).json({ status: 'not ready', service: process.env.SERVICE_NAME, error: 'Database unavailable' });
    }
  },

  liveness: (_req: Request, res: Response) => {
    res.json({ status: 'alive', service: process.env.SERVICE_NAME });
  }
};
