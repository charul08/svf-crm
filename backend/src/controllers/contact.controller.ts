import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as contactService from '../services/contact.service';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';

export async function getContacts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { contacts, total } = await contactService.getContacts(req.user!.organizationId!, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      search: req.query.search as string,
      accountId: req.query.accountId as string,
      ownerId: req.query.ownerId as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as any,
    });
    sendPaginated(res, contacts, total, Number(req.query.page) || 1, Number(req.query.limit) || 20);
  } catch (err) { next(err); }
}

export async function getContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const contact = await contactService.getContactById(req.params.id, req.user!.organizationId!);
    sendSuccess(res, contact);
  } catch (err) { next(err); }
}

export async function createContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const contact = await contactService.createContact(req.user!.organizationId!, req.body);
    sendCreated(res, contact, 'Contact created successfully');
  } catch (err) { next(err); }
}

export async function updateContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const contact = await contactService.updateContact(req.params.id, req.user!.organizationId!, req.body);
    sendSuccess(res, contact, 'Contact updated successfully');
  } catch (err) { next(err); }
}

export async function deleteContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await contactService.deleteContact(req.params.id, req.user!.organizationId!);
    sendSuccess(res, null, 'Contact deleted successfully');
  } catch (err) { next(err); }
}
