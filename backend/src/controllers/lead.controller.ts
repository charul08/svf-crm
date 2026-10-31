import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as leadService from '../services/lead.service';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';
import { AppError } from '../utils/AppError';

export async function getLeads(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.user!.organizationId!;
    const { page, limit, search, status, source, ownerId, dateFrom, dateTo, sortBy, sortOrder } = req.query;

    const { leads, total } = await leadService.getLeads(orgId, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search: search as string,
      status: status as any,
      source: source as any,
      ownerId: ownerId as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as any,
    });

    sendPaginated(res, leads, total, Number(page) || 1, Number(limit) || 20);
  } catch (err) {
    next(err);
  }
}

export async function getLead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const lead = await leadService.getLeadById(req.params.id, req.user!.organizationId!);
    sendSuccess(res, lead);
  } catch (err) {
    next(err);
  }
}

export async function createLead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const lead = await leadService.createLead(req.user!.organizationId!, req.body, req.user!.membershipId);
    sendCreated(res, lead, 'Lead created successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateLead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const lead = await leadService.updateLead(req.params.id, req.user!.organizationId!, req.body);
    sendSuccess(res, lead, 'Lead updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteLead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await leadService.deleteLead(req.params.id, req.user!.organizationId!);
    sendSuccess(res, null, 'Lead deleted successfully');
  } catch (err) {
    next(err);
  }
}

export async function convertLead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.membershipId) throw AppError.unauthorized();

    const result = await leadService.convertLead(
      req.params.id,
      req.user.organizationId!,
      req.user.membershipId,
      req.body
    );
    sendSuccess(res, result, 'Lead converted successfully');
  } catch (err) {
    next(err);
  }
}
