import { Router } from 'express';
import { categoryController } from '../controllers/categoryController';
import { validate, validateParams } from '../../../../shared/utils/validation';
import { authenticate } from '../../../../shared/middleware/auth';
import { requireRole } from '../../../../shared/middleware/rbac';
import { 
  createCategorySchema, 
  updateCategorySchema,
  categoryParamsSchema,
  categorySlugParamsSchema
} from '../../../../shared/schemas/categorySchemas';

const router = Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: List all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', categoryController.list);

/**
 * @swagger
 * /api/categories/parent:
 *   get:
 *     summary: Get categories by parent
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Parent category ID (use 'null' for root categories)
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/parent', categoryController.getByParent);

/**
 * @swagger
 * /api/categories/slug/{slug}:
 *   get:
 *     summary: Get category by slug
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 */
router.get('/slug/:slug', validateParams(categorySlugParamsSchema), categoryController.getBySlug);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 */
router.get('/:id', validateParams(categoryParamsSchema), categoryController.get);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategory'
 *     responses:
 *       201:
 *         description: Category created
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, requireRole('ADMIN', 'SELLER'), validate(createCategorySchema), categoryController.create);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
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
 *             $ref: '#/components/schemas/UpdateCategory'
 *     responses:
 *       200:
 *         description: Category updated
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticate, requireRole('ADMIN', 'SELLER'), validateParams(categoryParamsSchema), validate(updateCategorySchema), categoryController.update);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
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
 *         description: Category deleted
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), validateParams(categoryParamsSchema), categoryController.remove);

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *         parentId:
 *           type: string
 *         image:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         sortOrder:
 *           type: number
 *         metadata:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateCategory:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *         parentId:
 *           type: string
 *         image:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         sortOrder:
 *           type: number
 *     UpdateCategory:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *         parentId:
 *           type: string
 *         image:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         sortOrder:
 *           type: number
 */

export default router;
