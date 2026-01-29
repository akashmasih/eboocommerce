import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestTracing(req: Request, _res: Response, next: NextFunction) {
  (req as any).requestId = req.headers['x-request-id'] || randomUUID();
  next();
}
