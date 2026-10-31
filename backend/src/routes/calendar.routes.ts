import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { sendSuccess } from '../utils/response';

const router = Router();
router.use(authenticate);

// Get calendar events (activities + tasks with due dates)
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.organizationId!;
    const { from, to } = req.query;
    const dateWhere: any = {};
    if (from) dateWhere.gte = new Date(from as string);
    if (to) dateWhere.lte = new Date(to as string);

    const [activities, tasks] = await Promise.all([
      prisma.activity.findMany({
        where: {
          organizationId: orgId, isDeleted: false,
          ...(from || to ? { scheduledAt: dateWhere } : {}),
        },
        orderBy: { scheduledAt: 'asc' },
        include: {
          lead: { select: { id: true, firstName: true, lastName: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          deal: { select: { id: true, name: true } },
        },
      }),
      prisma.task.findMany({
        where: {
          organizationId: orgId, isDeleted: false, dueDate: { not: null },
          ...(from || to ? { dueDate: dateWhere } : {}),
        },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    const events = [
      ...activities.map((a) => ({
        id: a.id,
        type: 'activity',
        activityType: a.type,
        title: a.title,
        start: a.scheduledAt,
        end: a.completedAt || null,
        description: a.description,
        lead: a.lead,
        contact: a.contact,
        deal: a.deal,
      })),
      ...tasks.map((t) => ({
        id: t.id,
        type: 'task',
        title: t.title,
        start: t.dueDate,
        description: t.description,
        priority: t.priority,
        status: t.status,
      })),
    ];

    sendSuccess(res, events);
  } catch (err) { next(err); }
});

export default router;
