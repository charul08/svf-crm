import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { Prisma, DealStage } from '@prisma/client';

const STAGE_PROBABILITIES: Record<DealStage, number> = {
  PROSPECTING: 5,
  QUALIFICATION: 10,
  NEEDS_ANALYSIS: 25,
  VALUE_PROPOSITION: 35,
  DECISION_MAKERS: 50,
  PROPOSAL: 65,
  NEGOTIATION: 80,
  CLOSED_WON: 100,
  CLOSED_LOST: 0,
};

interface DealFilters {
  page?: number;
  limit?: number;
  search?: string;
  stage?: DealStage;
  ownerId?: string;
  accountId?: string;
  contactId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getDeals(organizationId: string, filters: DealFilters) {
  const { page = 1, limit = 20, search, stage, ownerId, accountId, contactId, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.DealWhereInput = {
    organizationId,
    isDeleted: false,
    ...(stage && { stage }),
    ...(ownerId && { ownerId }),
    ...(accountId && { accountId }),
    ...(contactId && { contactId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where, skip, take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        account: { select: { id: true, name: true } },
        owner: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
        _count: { select: { activities: true, notes: true, tasks: true } },
      },
    }),
    prisma.deal.count({ where }),
  ]);

  return { deals, total };
}

export async function getDealById(id: string, organizationId: string) {
  const deal = await prisma.deal.findFirst({
    where: { id, organizationId, isDeleted: false },
    include: {
      contact: true,
      account: true,
      owner: { include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } } },
      stageHistory: { orderBy: { createdAt: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' }, take: 20 },
      activities: { orderBy: { scheduledAt: 'desc' }, take: 20 },
      tasks: { where: { isDeleted: false }, take: 10 },
      tags: { include: { tag: true } },
    },
  });
  if (!deal) throw AppError.notFound('Deal not found');
  return deal;
}

export async function createDeal(organizationId: string, data: Record<string, unknown>) {
  const stage = (data.stage as DealStage) || 'PROSPECTING';
  const probability = data.probability !== undefined ? data.probability : STAGE_PROBABILITIES[stage];

  const deal = await prisma.deal.create({
    data: {
      ...data,
      organizationId,
      probability: probability as number,
      stage,
    } as Prisma.DealUncheckedCreateInput,
  });

  // Record initial stage history
  await prisma.dealStageHistory.create({
    data: {
      dealId: deal.id,
      toStage: stage,
    },
  });

  return deal;
}

export async function updateDeal(id: string, organizationId: string, data: Record<string, unknown>) {
  const existing = await prisma.deal.findFirst({ where: { id, organizationId, isDeleted: false } });
  if (!existing) throw AppError.notFound('Deal not found');
  return prisma.deal.update({ where: { id }, data: data as Prisma.DealUpdateInput });
}

export async function updateDealStage(
  id: string,
  organizationId: string,
  userId: string,
  data: { stage: DealStage; probability?: number; winReason?: string; lossReason?: string; note?: string }
) {
  const existing = await prisma.deal.findFirst({ where: { id, organizationId, isDeleted: false } });
  if (!existing) throw AppError.notFound('Deal not found');

  const probability = data.probability !== undefined ? data.probability : STAGE_PROBABILITIES[data.stage];

  return prisma.$transaction(async (tx) => {
    const deal = await tx.deal.update({
      where: { id },
      data: {
        stage: data.stage,
        probability,
        winReason: data.winReason,
        lossReason: data.lossReason,
        closedAt: ['CLOSED_WON', 'CLOSED_LOST'].includes(data.stage) ? new Date() : null,
      },
    });

    await tx.dealStageHistory.create({
      data: {
        dealId: id,
        fromStage: existing.stage,
        toStage: data.stage,
        changedById: userId,
        note: data.note,
      },
    });

    return deal;
  });
}

export async function deleteDeal(id: string, organizationId: string) {
  const existing = await prisma.deal.findFirst({ where: { id, organizationId, isDeleted: false } });
  if (!existing) throw AppError.notFound('Deal not found');
  return prisma.deal.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
}

export async function getDealsByStage(organizationId: string) {
  const deals = await prisma.deal.findMany({
    where: { organizationId, isDeleted: false },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      account: { select: { id: true, name: true } },
      owner: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const stages: DealStage[] = ['PROSPECTING', 'QUALIFICATION', 'NEEDS_ANALYSIS', 'VALUE_PROPOSITION', 'DECISION_MAKERS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  const pipeline: Record<string, { deals: typeof deals; total: number; count: number }> = {};

  stages.forEach((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    pipeline[stage] = {
      deals: stageDeals,
      total: stageDeals.reduce((sum, d) => sum + Number(d.amount), 0),
      count: stageDeals.length,
    };
  });

  return pipeline;
}
