import { Router } from 'express';
import { productController } from '../controllers/productController';
import { validate, validateQuery, validateParams } from '../../../../shared/utils/validation';
import { authenticate } from '../../../../shared/middleware/auth';
import { requireRole } from '../../../../shared/middleware/rbac';
import { 
  createProductSchema, 
  updateProductSchema, 
  productQuerySchema,
  productParamsSchema 
} from '../../../../shared/schemas/productSchemas';

const router = Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *         description: Filter by seller
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, inactive, archived]
 *         description: Filter by status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter products in stock
 *     responses:
 *       200:
 *         description: List of products with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     offset:
 *                       type: number
 *                     hasMore:
 *                       type: boolean
 */
router.get('/', productController.list);

/**
 * @swagger
 * /api/products/seller/{sellerId}:
 *   get:
 *     summary: Get products by seller
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/seller/:sellerId', productController.getBySeller);

/**
 * @swagger
 * /api/products/slug/{slug}:
 *   get:
 *     summary: Get a product by slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/slug/:slug', productController.getBySlug);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:id', validateParams(productParamsSchema), productController.get);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProduct'
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, requireRole('ADMIN', 'SELLER'), validate(createProductSchema), productController.create);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProduct'
 *     responses:
 *       200:
 *         description: Product updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.put('/:id', authenticate, requireRole('ADMIN', 'SELLER'), validateParams(productParamsSchema), validate(updateProductSchema), productController.update);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Product deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), validateParams(productParamsSchema), productController.remove);

/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Update product stock
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: Quantity to add (positive) or subtract (negative)
 *     responses:
 *       200:
 *         description: Stock updated
 *       400:
 *         description: Invalid quantity or insufficient stock
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id/stock', authenticate, requireRole('ADMIN', 'SELLER'), productController.updateStock);

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         sku:
 *           type: string
 *         categoryId:
 *           type: string
 *         sellerId:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         price:
 *           type: number
 *         compareAtPrice:
 *           type: number
 *         cost:
 *           type: number
 *         stock:
 *           type: number
 *         status:
 *           type: string
 *           enum: [draft, active, inactive, archived]
 *         variants:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               value: { type: string }
 *               sku: { type: string }
 *               price: { type: number }
 *               stock: { type: number }
 *               image: { type: string }
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         weight:
 *           type: number
 *         dimensions:
 *           type: object
 *         slug:
 *           type: string
 *         metaTitle:
 *           type: string
 *         metaDescription:
 *           type: string
 *         metadata:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateProduct:
 *       type: object
 *       required:
 *         - title
 *         - sellerId
 *         - price
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         sku:
 *           type: string
 *         categoryId:
 *           type: string
 *         sellerId:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         price:
 *           type: number
 *         compareAtPrice:
 *           type: number
 *         cost:
 *           type: number
 *         stock:
 *           type: number
 *         status:
 *           type: string
 *           enum: [draft, active, inactive, archived]
 *         variants:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               value: { type: string }
 *               sku: { type: string }
 *               price: { type: number }
 *               stock: { type: number }
 *               image: { type: string }
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         weight:
 *           type: number
 *         dimensions:
 *           type: object
 *         slug:
 *           type: string
 *         metaTitle:
 *           type: string
 *         metaDescription:
 *           type: string
 *         metadata:
 *           type: object
 *     UpdateProduct:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         sku:
 *           type: string
 *         categoryId:
 *           type: string
 *         sellerId:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         price:
 *           type: number
 *         compareAtPrice:
 *           type: number
 *         cost:
 *           type: number
 *         stock:
 *           type: number
 *         status:
 *           type: string
 *           enum: [draft, active, inactive, archived]
 *         variants:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               value: { type: string }
 *               sku: { type: string }
 *               price: { type: number }
 *               stock: { type: number }
 *               image: { type: string }
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         weight:
 *           type: number
 *         dimensions:
 *           type: object
 *         slug:
 *           type: string
 *         metaTitle:
 *           type: string
 *         metaDescription:
 *           type: string
 *         metadata:
 *           type: object
 */

export default router;
