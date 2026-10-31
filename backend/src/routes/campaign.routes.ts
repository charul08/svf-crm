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
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where: { organizationId: req.user!.organizationId! },
        skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { _count: { select: { campaignLeads: true } } },
      }),
      prisma.campaign.count({ where: { organizationId: req.user!.organizationId! } }),
    ]);
    sendPaginated(res, campaigns, total, page, limit);
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const campaign = await prisma.campaign.create({
      data: { ...req.body, organizationId: req.user!.organizationId! },
    });
    sendCreated(res, campaign, 'Campaign created');
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId! },
      include: {
        campaignLeads: { include: { lead: { select: { id: true, firstName: true, lastName: true, email: true, status: true } } } },
      },
    });
    if (!campaign) throw AppError.notFound('Campaign not found');
    sendSuccess(res, campaign);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const campaign = await prisma.campaign.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, campaign, 'Campaign updated');
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.campaign.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Campaign deleted');
  } catch (err) { next(err); }
});

export default router;
