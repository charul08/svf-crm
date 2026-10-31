import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';
import { AppError } from '../utils/AppError';

const router = Router();
router.use(authenticate);

// Helper to calculate quote totals server-side
function calculateTotals(lineItems: Array<{ quantity: number; unitPrice: number; discount: number; taxRate: number }>) {
  let subtotal = 0;
  let discountAmount = 0;
  let taxAmount = 0;

  for (const item of lineItems) {
    const lineTotal = item.quantity * item.unitPrice;
    const disc = lineTotal * (item.discount / 100);
    const afterDiscount = lineTotal - disc;
    const tax = afterDiscount * (item.taxRate / 100);
    subtotal += lineTotal;
    discountAmount += disc;
    taxAmount += tax;
  }

  return {
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal: subtotal - discountAmount + taxAmount,
  };
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where: { organizationId: req.user!.organizationId! },
        skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { contact: { select: { id: true, firstName: true, lastName: true } }, lineItems: true },
      }),
      prisma.quote.count({ where: { organizationId: req.user!.organizationId! } }),
    ]);
    sendPaginated(res, quotes, total, page, limit);
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.organizationId!;
    const { lineItems = [], ...quoteData } = req.body;

    // Generate quote number
    const count = await prisma.quote.count({ where: { organizationId: orgId } });
    const quoteNumber = `QT-${String(count + 1).padStart(4, '0')}`;

    // Calculate totals server-side
    const totals = calculateTotals(lineItems);

    const quote = await prisma.quote.create({
      data: {
        ...quoteData,
        organizationId: orgId,
        quoteNumber,
        ...totals,
        lineItems: {
          create: lineItems.map((item: any, idx: number) => {
            const lineTotal = item.quantity * item.unitPrice;
            const disc = lineTotal * (item.discount / 100);
            const afterDiscount = lineTotal - disc;
            const tax = afterDiscount * (item.taxRate / 100);
            return {
              ...item,
              total: afterDiscount + tax,
              sortOrder: idx,
            };
          }),
        },
      },
      include: { lineItems: true },
    });
    sendCreated(res, quote, 'Quote created');
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId! },
      include: { lineItems: { include: { product: true } }, contact: true, deal: true },
    });
    if (!quote) throw AppError.notFound('Quote not found');
    sendSuccess(res, quote);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lineItems, ...updateData } = req.body;
    const quote = await prisma.quote.update({ where: { id: req.params.id }, data: updateData });
    sendSuccess(res, quote, 'Quote updated');
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.quote.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Quote deleted');
  } catch (err) { next(err); }
});

export default router;
