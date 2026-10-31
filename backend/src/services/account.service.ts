import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { Prisma } from '@prisma/client';

interface AccountFilters {
  page?: number;
  limit?: number;
  search?: string;
  ownerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getAccounts(organizationId: string, filters: AccountFilters) {
  const { page = 1, limit = 20, search, ownerId, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.AccountWhereInput = {
    organizationId,
    isDeleted: false,
    ...(ownerId && { ownerId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [accounts, total] = await Promise.all([
    prisma.account.findMany({
      where, skip, take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        owner: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
        _count: { select: { contacts: true, deals: true } },
      },
    }),
    prisma.account.count({ where }),
  ]);

  return { accounts, total };
}

export async function getAccountById(id: string, organizationId: string) {
  const account = await prisma.account.findFirst({
    where: { id, organizationId, isDeleted: false },
    include: {
      owner: { include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } } },
      contacts: { where: { isDeleted: false }, take: 20 },
      deals: { where: { isDeleted: false }, take: 10 },
      notes: { orderBy: { createdAt: 'desc' }, take: 20 },
      activities: { orderBy: { scheduledAt: 'desc' }, take: 10 },
    },
  });
  if (!account) throw AppError.notFound('Account not found');
  return account;
}

export async function createAccount(organizationId: string, data: Record<string, unknown>) {
  return prisma.account.create({
    data: { ...data, organizationId } as Prisma.AccountUncheckedCreateInput,
  });
}

export async function updateAccount(id: string, organizationId: string, data: Record<string, unknown>) {
  const existing = await prisma.account.findFirst({ where: { id, organizationId, isDeleted: false } });
  if (!existing) throw AppError.notFound('Account not found');
  return prisma.account.update({ where: { id }, data: data as Prisma.AccountUpdateInput });
}

export async function deleteAccount(id: string, organizationId: string) {
  const existing = await prisma.account.findFirst({ where: { id, organizationId, isDeleted: false } });
  if (!existing) throw AppError.notFound('Account not found');
  return prisma.account.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
}
