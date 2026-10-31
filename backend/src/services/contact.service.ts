import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { Prisma } from '@prisma/client';

interface ContactFilters {
  page?: number;
  limit?: number;
  search?: string;
  accountId?: string;
  ownerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getContacts(organizationId: string, filters: ContactFilters) {
  const { page = 1, limit = 20, search, accountId, ownerId, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.ContactWhereInput = {
    organizationId,
    isDeleted: false,
    ...(accountId && { accountId }),
    ...(ownerId && { ownerId }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where, skip, take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        account: { select: { id: true, name: true } },
        owner: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
        _count: { select: { deals: true, activities: true, notes: true } },
      },
    }),
    prisma.contact.count({ where }),
  ]);

  return { contacts, total };
}

export async function getContactById(id: string, organizationId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id, organizationId, isDeleted: false },
    include: {
      account: true,
      owner: { include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } } },
      deals: { where: { isDeleted: false }, take: 10 },
      notes: { orderBy: { createdAt: 'desc' }, take: 20 },
      activities: { orderBy: { scheduledAt: 'desc' }, take: 20 },
      tags: { include: { tag: true } },
    },
  });
  if (!contact) throw AppError.notFound('Contact not found');
  return contact;
}

export async function createContact(organizationId: string, data: Record<string, unknown>) {
  const { notes, tags, ...contactData } = data as { notes?: string; tags?: string[]; [key: string]: unknown };
  return prisma.contact.create({
    data: { ...contactData, organizationId } as Prisma.ContactUncheckedCreateInput,
  });
}

export async function updateContact(id: string, organizationId: string, data: Record<string, unknown>) {
  const existing = await prisma.contact.findFirst({ where: { id, organizationId, isDeleted: false } });
  if (!existing) throw AppError.notFound('Contact not found');
  const { notes, tags, ...updateData } = data as { notes?: string; tags?: string[]; [key: string]: unknown };
  return prisma.contact.update({ where: { id }, data: updateData as Prisma.ContactUpdateInput });
}

export async function deleteContact(id: string, organizationId: string) {
  const existing = await prisma.contact.findFirst({ where: { id, organizationId, isDeleted: false } });
  if (!existing) throw AppError.notFound('Contact not found');
  return prisma.contact.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
}
