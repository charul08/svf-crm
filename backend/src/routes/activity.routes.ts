import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';
import { AppError } from '../utils/AppError';

const router = Router();
router.use(authenticate);

// GET /activities
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const orgId = req.user!.organizationId!;

    const where: any = { organizationId: orgId, isDeleted: false };
    if (req.query.type) where.type = req.query.type;
    if (req.query.leadId) where.leadId = req.query.leadId;
    if (req.query.contactId) where.contactId = req.query.contactId;
    if (req.query.dealId) where.dealId = req.query.dealId;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({ where, skip, take: limit, orderBy: { scheduledAt: 'desc' } }),
      prisma.activity.count({ where }),
    ]);
    sendPaginated(res, activities, total, page, limit);
  } catch (err) { next(err); }
});

// POST /activities
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activity = await prisma.activity.create({
      data: { ...req.body, organizationId: req.user!.organizationId! },
    });
    sendCreated(res, activity, 'Activity created');
  } catch (err) { next(err); }
});

// PATCH /activities/:id
router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.activity.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId!, isDeleted: false } });
    if (!existing) throw AppError.notFound('Activity not found');
    const activity = await prisma.activity.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, activity, 'Activity updated');
  } catch (err) { next(err); }
});

// DELETE /activities/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.activity.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId!, isDeleted: false } });
    if (!existing) throw AppError.notFound('Activity not found');
    await prisma.activity.update({ where: { id: req.params.id }, data: { isDeleted: true } });
    sendSuccess(res, null, 'Activity deleted');
  } catch (err) { next(err); }
});

export default router;
