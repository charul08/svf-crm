import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { sendSuccess } from '../utils/response';

const router = Router();
router.use(authenticate);

router.get('/leads-by-source', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.lead.groupBy({
      by: ['source'],
      where: { organizationId: req.user!.organizationId!, isDeleted: false },
      _count: true,
    });
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/leads-by-status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.lead.groupBy({
      by: ['status'],
      where: { organizationId: req.user!.organizationId!, isDeleted: false },
      _count: true,
    });
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/deals-pipeline', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.deal.groupBy({
      by: ['stage'],
      where: { organizationId: req.user!.organizationId!, isDeleted: false },
      _count: true,
      _sum: { amount: true },
    });
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/monthly-revenue', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.organizationId!;
    const data = await prisma.$queryRaw<Array<{ month: string; revenue: number; count: number }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "closedAt"), 'Mon YYYY') as month,
        COALESCE(SUM(amount), 0)::float as revenue,
        COUNT(*)::int as count
      FROM "Deal"
      WHERE "organizationId" = ${orgId}
        AND "stage" = 'CLOSED_WON'
        AND "isDeleted" = false
        AND "closedAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "closedAt")
      ORDER BY DATE_TRUNC('month', "closedAt")
    `;
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/sales-by-member', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.organizationId!;
    const data = await prisma.deal.groupBy({
      by: ['ownerId'],
      where: { organizationId: orgId, isDeleted: false, stage: 'CLOSED_WON' },
      _count: true,
      _sum: { amount: true },
    });
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/overdue-tasks', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.task.findMany({
      where: {
        organizationId: req.user!.organizationId!,
        isDeleted: false,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { lt: new Date() },
      },
      include: {
        assignee: { include: { user: { select: { id: true, fullName: true } } } },
      },
      orderBy: { dueDate: 'asc' },
    });
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

export default router;
