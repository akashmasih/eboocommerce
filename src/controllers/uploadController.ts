import { Readable } from 'stream';
import { Request, Response, NextFunction } from 'express';
import { cloudinary } from '../config/cloudinary';
import { logger } from '../shared/utils/logger';
import { BadRequestError } from '../shared/utils/errors';

const getFolder = (type?: string) => {
  if (type === 'category') return 'eboocommerce/categories';
  if (type === 'product') return 'eboocommerce/products';
  return 'eboocommerce';
};

/**
 * Upload a single file to Cloudinary (e.g. category image)
 * POST /api/upload
 * Field name: file
 * Query: ?folder=category|product (optional)
 */
export const uploadSingleFile = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new BadRequestError('No file uploaded. Use field name "file".'));
  }
  const folder = getFolder(req.query.folder as string);
  const publicId = `eboo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  try {
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          overwrite: true
        },
        (err, result) => {
          if (err) return reject(err);
          if (!result?.secure_url) return reject(new Error('Upload failed'));
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      );
      const readable = Readable.from(req.file!.buffer);
      readable.pipe(uploadStream);
    });

    const optimizeUrl = cloudinary.url(result.public_id, {
      fetch_format: 'auto',
      quality: 'auto'
    });

    logger.info({ public_id: result.public_id, url: result.secure_url }, 'File uploaded to Cloudinary');
    res.status(201).json({
      url: result.secure_url,
      optimizedUrl: optimizeUrl,
      publicId: result.public_id,
      filename: req.file.originalname
    });
  } catch (err) {
    logger.error({ err }, 'Cloudinary upload failed');
    next(err instanceof Error ? err : new BadRequestError('Image upload failed'));
  }
};

/**
 * Upload multiple files to Cloudinary (e.g. product images, variant images)
 * POST /api/upload/multiple
 * Field name: files (max 10)
 * Query: ?folder=product (optional)
 */
export const uploadMultipleFiles = async (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return next(new BadRequestError('No files uploaded. Use field name "files".'));
  }
  const folder = getFolder((req.query.folder as string) || 'product');

  try {
    const results = await Promise.all(
      files.map((file, index) => {
        const publicId = `eboo-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;
        return new Promise<{ url: string; optimizedUrl: string; publicId: string; filename: string }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              public_id: publicId,
              resource_type: 'image',
              overwrite: true
            },
            (err, result) => {
              if (err) return reject(err);
              if (!result?.secure_url) return reject(new Error('Upload failed'));
              const optimizeUrl = cloudinary.url(result.public_id, {
                fetch_format: 'auto',
                quality: 'auto'
              });
              resolve({
                url: result.secure_url,
                optimizedUrl,
                publicId: result.public_id,
                filename: file.originalname
              });
            }
          );
          const readable = Readable.from(file.buffer);
          readable.pipe(uploadStream);
        });
      })
    );

    const urls = results.map((r) => r.url);
    const optimizedUrls = results.map((r) => r.optimizedUrl);
    const publicIds = results.map((r) => r.publicId);
    const filenames = results.map((r) => r.filename);

    logger.info({ count: results.length, publicIds }, 'Files uploaded to Cloudinary');
    res.status(201).json({
      urls,
      optimizedUrls,
      publicIds,
      filenames
    });
  } catch (err) {
    logger.error({ err }, 'Cloudinary multiple upload failed');
    next(err instanceof Error ? err : new BadRequestError('Image upload failed'));
  }
};
