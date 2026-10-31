import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user!.organizationId! },
    });
    if (!org) throw AppError.notFound('Organization not found');
    sendSuccess(res, org);
  } catch (err) { next(err); }
});

router.patch('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, timezone, currency, dateFormat } = req.body;
    const org = await prisma.organization.update({
      where: { id: req.user!.organizationId! },
      data: { name, timezone, currency, dateFormat },
    });
    sendSuccess(res, org, 'Organization updated');
  } catch (err) { next(err); }
});

export default router;
