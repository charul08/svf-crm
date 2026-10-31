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

    const where: any = { organizationId: orgId, isDeleted: false };
    if (req.query.status) where.status = req.query.status;
    if (req.query.priority) where.priority = req.query.priority;
    if (req.query.assigneeId) where.assigneeId = req.query.assigneeId;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({ where, skip, take: limit, orderBy: { dueDate: 'asc' },
        include: {
          assignee: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
        }
      }),
      prisma.task.count({ where }),
    ]);
    sendPaginated(res, tasks, total, page, limit);
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.create({
      data: { ...req.body, organizationId: req.user!.organizationId! },
    });
    sendCreated(res, task, 'Task created');
  } catch (err) { next(err); }
});

router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId!, isDeleted: false } });
    if (!existing) throw AppError.notFound('Task not found');
    
    const updateData: any = { ...req.body };
    if (req.body.status === 'COMPLETED' && !existing.completedAt) {
      updateData.completedAt = new Date();
    }
    
    const task = await prisma.task.update({ where: { id: req.params.id }, data: updateData });
    sendSuccess(res, task, 'Task updated');
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId!, isDeleted: false } });
    if (!existing) throw AppError.notFound('Task not found');
    await prisma.task.update({ where: { id: req.params.id }, data: { isDeleted: true } });
    sendSuccess(res, null, 'Task deleted');
  } catch (err) { next(err); }
});

export default router;
