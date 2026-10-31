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
    const members = await prisma.organizationMembership.findMany({
      where: { organizationId: orgId, isActive: true },
      include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true, createdAt: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    sendSuccess(res, members);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, isActive } = req.body;
    const member = await prisma.organizationMembership.update({
      where: { id: req.params.id },
      data: { ...(role && { role }), ...(isActive !== undefined && { isActive }) },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    sendSuccess(res, member, 'Member updated');
  } catch (err) { next(err); }
});

export default router;
