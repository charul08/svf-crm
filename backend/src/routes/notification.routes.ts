import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { sendSuccess } from '../utils/response';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.organizationId!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user!.userId, organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.notification.count({ where: { userId: req.user!.userId, organizationId: orgId } }),
      prisma.notification.count({ where: { userId: req.user!.userId, organizationId: orgId, isRead: false } }),
    ]);

    sendSuccess(res, { notifications, total, unreadCount, page, limit });
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true, readAt: new Date() },
    });
    sendSuccess(res, null, 'Notification marked as read');
  } catch (err) { next(err); }
});

router.patch('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, organizationId: req.user!.organizationId!, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
});

export default router;
