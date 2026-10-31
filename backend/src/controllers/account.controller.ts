import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as accountService from '../services/account.service';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';

export async function getAccounts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { accounts, total } = await accountService.getAccounts(req.user!.organizationId!, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      search: req.query.search as string,
      ownerId: req.query.ownerId as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as any,
    });
    sendPaginated(res, accounts, total, Number(req.query.page) || 1, Number(req.query.limit) || 20);
  } catch (err) { next(err); }
}

export async function getAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await accountService.getAccountById(req.params.id, req.user!.organizationId!));
  } catch (err) { next(err); }
}

export async function createAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendCreated(res, await accountService.createAccount(req.user!.organizationId!, req.body), 'Account created');
  } catch (err) { next(err); }
}

export async function updateAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await accountService.updateAccount(req.params.id, req.user!.organizationId!, req.body), 'Account updated');
  } catch (err) { next(err); }
}

export async function deleteAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await accountService.deleteAccount(req.params.id, req.user!.organizationId!);
    sendSuccess(res, null, 'Account deleted');
  } catch (err) { next(err); }
}
