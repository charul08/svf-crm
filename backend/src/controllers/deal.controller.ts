import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as dealService from '../services/deal.service';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';
import { AppError } from '../utils/AppError';

export async function getDeals(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { deals, total } = await dealService.getDeals(req.user!.organizationId!, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      search: req.query.search as string,
      stage: req.query.stage as any,
      ownerId: req.query.ownerId as string,
      accountId: req.query.accountId as string,
      contactId: req.query.contactId as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as any,
    });
    sendPaginated(res, deals, total, Number(req.query.page) || 1, Number(req.query.limit) || 20);
  } catch (err) { next(err); }
}

export async function getPipeline(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const pipeline = await dealService.getDealsByStage(req.user!.organizationId!);
    sendSuccess(res, pipeline);
  } catch (err) { next(err); }
}

export async function getDeal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await dealService.getDealById(req.params.id, req.user!.organizationId!));
  } catch (err) { next(err); }
}

export async function createDeal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendCreated(res, await dealService.createDeal(req.user!.organizationId!, req.body), 'Deal created');
  } catch (err) { next(err); }
}

export async function updateDeal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await dealService.updateDeal(req.params.id, req.user!.organizationId!, req.body), 'Deal updated');
  } catch (err) { next(err); }
}

export async function updateDealStage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.userId) throw AppError.unauthorized();
    const deal = await dealService.updateDealStage(req.params.id, req.user.organizationId!, req.user.userId, req.body);
    sendSuccess(res, deal, 'Deal stage updated');
  } catch (err) { next(err); }
}

export async function deleteDeal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await dealService.deleteDeal(req.params.id, req.user!.organizationId!);
    sendSuccess(res, null, 'Deal deleted');
  } catch (err) { next(err); }
}
