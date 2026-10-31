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
    const { q } = req.query;
    if (!q || String(q).trim().length < 2) {
      sendSuccess(res, { leads: [], contacts: [], accounts: [], deals: [], products: [] });
      return;
    }

    const search = String(q).trim();
    const orgId = req.user!.organizationId!;

    const [leads, contacts, accounts, deals, products] = await Promise.all([
      prisma.lead.findMany({
        where: {
          organizationId: orgId, isDeleted: false,
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, firstName: true, lastName: true, email: true, company: true, status: true },
      }),
      prisma.contact.findMany({
        where: {
          organizationId: orgId, isDeleted: false,
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true },
      }),
      prisma.account.findMany({
        where: {
          organizationId: orgId, isDeleted: false,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, email: true, industry: true },
      }),
      prisma.deal.findMany({
        where: {
          organizationId: orgId, isDeleted: false,
          name: { contains: search, mode: 'insensitive' },
        },
        take: 5,
        select: { id: true, name: true, amount: true, stage: true },
      }),
      prisma.product.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, sku: true, unitPrice: true },
      }),
    ]);

    sendSuccess(res, { leads, contacts, accounts, deals, products });
  } catch (err) { next(err); }
});

export default router;
