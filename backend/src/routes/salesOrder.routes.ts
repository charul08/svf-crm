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
    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where: { organizationId: req.user!.organizationId! },
        skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { lineItems: true },
      }),
      prisma.salesOrder.count({ where: { organizationId: req.user!.organizationId! } }),
    ]);
    sendPaginated(res, orders, total, page, limit);
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.organizationId!;
    const count = await prisma.salesOrder.count({ where: { organizationId: orgId } });
    const orderNumber = `SO-${String(count + 1).padStart(4, '0')}`;
    const { lineItems = [], ...orderData } = req.body;

    const order = await prisma.salesOrder.create({
      data: {
        ...orderData, organizationId: orgId, orderNumber,
        lineItems: { create: lineItems },
      },
      include: { lineItems: true },
    });
    sendCreated(res, order, 'Sales order created');
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.salesOrder.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId! },
      include: { lineItems: { include: { product: true } } },
    });
    if (!order) throw AppError.notFound('Sales order not found');
    sendSuccess(res, order);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, order, 'Order updated');
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.salesOrder.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Order deleted');
  } catch (err) { next(err); }
});

export default router;
