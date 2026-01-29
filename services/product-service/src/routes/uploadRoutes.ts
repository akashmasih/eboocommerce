import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadSingleFile, uploadMultipleFiles } from '../controllers/uploadController';
import { uploadSingle, uploadMultiple } from '../config/upload';
import { authenticate } from '../../../../shared/middleware/auth';
import { requireRole } from '../../../../shared/middleware/rbac';
import { BadRequestError } from '../../../../shared/utils/errors';

const router = Router();

const handleMulterError = (err: unknown, _req: Request, _res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return next(new BadRequestError('File too large. Max 5MB.'));
    if (err.code === 'LIMIT_FILE_COUNT') return next(new BadRequestError('Too many files. Max 10.'));
    if (err.code === 'LIMIT_UNEXPECTED_FILE') return next(new BadRequestError('Unexpected field. Use "file" or "files".'));
  }
  if (err instanceof Error) return next(new BadRequestError(err.message));
  next(err);
};

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a single image to Cloudinary (e.g. category image)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *           enum: [category, product]
 *         description: Optional folder in Cloudinary (eboocommerce/categories or eboocommerce/products)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, GIF, max 5MB)
 *     responses:
 *       201:
 *         description: Upload successful. Returns Cloudinary URL (use url or optimizedUrl in category/product image).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url: { type: string }
 *                 optimizedUrl: { type: string }
 *                 publicId: { type: string }
 *                 filename: { type: string }
 *       400:
 *         description: No file or invalid file type
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, requireRole('ADMIN', 'SELLER'), (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    uploadSingleFile(req, res, next);
  });
});

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Upload multiple images (e.g. product images, variant images)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 10 images (JPEG, PNG, WebP, GIF, max 5MB each)
 *     responses:
 *       201:
 *         description: Upload successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: string
 *                 filenames:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: No files or invalid file type
 *       401:
 *         description: Unauthorized
 */
router.post('/multiple', authenticate, requireRole('ADMIN', 'SELLER'), (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    uploadMultipleFiles(req, res, next);
  });
});

export default router;
