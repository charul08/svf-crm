import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { getDashboardStats } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await getDashboardStats(req.user!.organizationId!, {
      from: dateFrom ? new Date(dateFrom as string) : undefined,
      to: dateTo ? new Date(dateTo as string) : undefined,
    });
    sendSuccess(res, data);
  } catch (err) { next(err); }
}
