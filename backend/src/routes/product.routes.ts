import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';
import { AppError } from '../utils/AppError';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const orgId = req.user!.organizationId!;
    const where: any = { organizationId: orgId };
    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search, mode: 'insensitive' } },
        { sku: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.product.count({ where }),
    ]);
    sendPaginated(res, products, total, page, limit);
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.create({
      data: { ...req.body, organizationId: req.user!.organizationId! },
    });
    sendCreated(res, product, 'Product created');
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId! } });
    if (!product) throw AppError.notFound('Product not found');
    sendSuccess(res, product);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.product.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId! } });
    if (!existing) throw AppError.notFound('Product not found');
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, product, 'Product updated');
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.product.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId! } });
    if (!existing) throw AppError.notFound('Product not found');
    await prisma.product.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Product deleted');
  } catch (err) { next(err); }
});

export default router;
