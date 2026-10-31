import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { Prisma, LeadStatus, LeadSource, DealStage } from '@prisma/client';

interface LeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  ownerId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getLeads(organizationId: string, filters: LeadFilters) {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    source,
    ownerId,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const skip = (page - 1) * limit;

  const where: Prisma.LeadWhereInput = {
    organizationId,
    isDeleted: false,
    ...(status && { status }),
    ...(source && { source }),
    ...(ownerId && { ownerId }),
    ...(dateFrom || dateTo ? {
      createdAt: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      },
    } : {}),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { lastName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { company: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { phone: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
      ],
    }),
  };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        owner: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
        },
        tags: { include: { tag: true } },
        _count: { select: { notes: true, activities: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return { leads, total };
}

export async function getLeadById(id: string, organizationId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id, organizationId, isDeleted: false },
    include: {
      owner: {
        include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
      },
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      activities: {
        orderBy: { scheduledAt: 'desc' },
        take: 20,
      },
      tags: { include: { tag: true } },
    },
  });

  if (!lead) throw AppError.notFound('Lead not found');
  return lead;
}

export async function createLead(organizationId: string, data: Record<string, unknown>, authorId?: string) {
  const { notes, tags, ...leadData } = data as {
    notes?: string;
    tags?: string[];
    [key: string]: unknown;
  };

  const lead = await prisma.lead.create({
    data: {
      ...leadData as Prisma.LeadCreateInput,
      organizationId,
      annualRevenue: leadData.annualRevenue ? leadData.annualRevenue as number : undefined,
    } as Prisma.LeadUncheckedCreateInput,
  });

  if (notes) {
    await prisma.note.create({
      data: {
        organizationId,
        leadId: lead.id,
        content: notes,
        authorId,
      },
    });
  }

  return lead;
}

export async function updateLead(id: string, organizationId: string, data: Record<string, unknown>) {
  const existing = await prisma.lead.findFirst({
    where: { id, organizationId, isDeleted: false },
  });
  if (!existing) throw AppError.notFound('Lead not found');

  const { notes, tags, ...updateData } = data as {
    notes?: string;
    tags?: string[];
    [key: string]: unknown;
  };

  return prisma.lead.update({
    where: { id },
    data: updateData as Prisma.LeadUpdateInput,
  });
}

export async function deleteLead(id: string, organizationId: string) {
  const existing = await prisma.lead.findFirst({
    where: { id, organizationId, isDeleted: false },
  });
  if (!existing) throw AppError.notFound('Lead not found');

  return prisma.lead.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
}

export async function convertLead(
  id: string,
  organizationId: string,
  membershipId: string,
  options: {
    createDeal?: boolean;
    dealName?: string;
    dealAmount?: number;
    dealStage?: DealStage;
  }
) {
  const lead = await prisma.lead.findFirst({
    where: { id, organizationId, isDeleted: false },
  });

  if (!lead) throw AppError.notFound('Lead not found');
  if (lead.status === 'CONVERTED') throw AppError.badRequest('Lead is already converted');

  return prisma.$transaction(async (tx) => {
    // Create Contact
    const contact = await tx.contact.create({
      data: {
        organizationId,
        ownerId: membershipId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        mobile: lead.mobile || undefined,
        jobTitle: lead.jobTitle || undefined,
      },
    });

    // Create Account if company provided
    let account = null;
    if (lead.company) {
      account = await tx.account.create({
        data: {
          organizationId,
          ownerId: membershipId,
          name: lead.company,
          phone: lead.phone || undefined,
          email: lead.email || undefined,
          industry: lead.industry || undefined,
          annualRevenue: lead.annualRevenue || undefined,
        },
      });

      // Link contact to account
      await tx.contact.update({
        where: { id: contact.id },
        data: { accountId: account.id },
      });
    }

    // Create Deal if requested
    let deal = null;
    if (options.createDeal) {
      deal = await tx.deal.create({
        data: {
          organizationId,
          ownerId: membershipId,
          contactId: contact.id,
          accountId: account?.id || undefined,
          name: options.dealName || `Deal - ${lead.firstName} ${lead.lastName}`,
          amount: options.dealAmount || 0,
          stage: options.dealStage || 'QUALIFICATION',
          source: lead.source,
        },
      });
    }

    // Mark lead as converted
    await tx.lead.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        convertedAt: new Date(),
        convertedContactId: contact.id,
        convertedAccountId: account?.id || undefined,
        convertedDealId: deal?.id || undefined,
      },
    });

    return { contact, account, deal };
  });
}

export async function getLeadStats(organizationId: string) {
  const [total, byStatus, bySource] = await Promise.all([
    prisma.lead.count({ where: { organizationId, isDeleted: false } }),
    prisma.lead.groupBy({
      by: ['status'],
      where: { organizationId, isDeleted: false },
      _count: true,
    }),
    prisma.lead.groupBy({
      by: ['source'],
      where: { organizationId, isDeleted: false },
      _count: true,
    }),
  ]);

  return { total, byStatus, bySource };
}
