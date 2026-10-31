import { prisma } from '../lib/prisma';

export async function getDashboardStats(organizationId: string, dateFilter?: { from?: Date; to?: Date }) {
  const dateWhere = dateFilter?.from || dateFilter?.to ? {
    createdAt: {
      ...(dateFilter.from && { gte: dateFilter.from }),
      ...(dateFilter.to && { lte: dateFilter.to }),
    },
  } : {};

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    totalLeads,
    newLeads,
    totalContacts,
    totalAccounts,
    openDeals,
    wonDeals,
    lostDeals,
    pendingTasks,
    overdueTasks,
    totalRevenue,
    recentLeads,
    recentContacts,
    upcomingActivities,
    overdueTasksList,
    recentDeals,
    leadsByStatus,
    leadsBySource,
    dealsByStage,
    monthlyRevenue,
  ] = await Promise.all([
    // KPI counts
    prisma.lead.count({ where: { organizationId, isDeleted: false, ...dateWhere } }),
    prisma.lead.count({ where: { organizationId, isDeleted: false, status: 'NEW', ...dateWhere } }),
    prisma.contact.count({ where: { organizationId, isDeleted: false } }),
    prisma.account.count({ where: { organizationId, isDeleted: false } }),
    prisma.deal.count({ where: { organizationId, isDeleted: false, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } } }),
    prisma.deal.count({ where: { organizationId, isDeleted: false, stage: 'CLOSED_WON' } }),
    prisma.deal.count({ where: { organizationId, isDeleted: false, stage: 'CLOSED_LOST' } }),
    prisma.task.count({ where: { organizationId, isDeleted: false, status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
    prisma.task.count({
      where: {
        organizationId, isDeleted: false,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { lt: now },
      },
    }),
    // Total won revenue
    prisma.deal.aggregate({
      where: { organizationId, isDeleted: false, stage: 'CLOSED_WON' },
      _sum: { amount: true },
    }),
    // Recent leads
    prisma.lead.findMany({
      where: { organizationId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, firstName: true, lastName: true, company: true, email: true, status: true, source: true, createdAt: true },
    }),
    // Recent contacts
    prisma.contact.findMany({
      where: { organizationId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true, createdAt: true },
    }),
    // Upcoming activities
    prisma.activity.findMany({
      where: { organizationId, isDeleted: false, scheduledAt: { gte: now }, completedAt: null },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    }),
    // Overdue tasks
    prisma.task.findMany({
      where: {
        organizationId, isDeleted: false,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { lt: now },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    // Recent deals
    prisma.deal.findMany({
      where: { organizationId, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, amount: true, stage: true, updatedAt: true },
    }),
    // Leads by status
    prisma.lead.groupBy({
      by: ['status'],
      where: { organizationId, isDeleted: false },
      _count: true,
    }),
    // Leads by source
    prisma.lead.groupBy({
      by: ['source'],
      where: { organizationId, isDeleted: false },
      _count: true,
    }),
    // Deals by stage
    prisma.deal.groupBy({
      by: ['stage'],
      where: { organizationId, isDeleted: false },
      _count: true,
      _sum: { amount: true },
    }),
    // Monthly revenue (last 6 months)
    prisma.$queryRaw<Array<{ month: string; revenue: number; count: number }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "closedAt"), 'Mon YYYY') as month,
        COALESCE(SUM(amount), 0) as revenue,
        COUNT(*) as count
      FROM "Deal"
      WHERE "organizationId" = ${organizationId}
        AND "stage" = 'CLOSED_WON'
        AND "isDeleted" = false
        AND "closedAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "closedAt")
      ORDER BY DATE_TRUNC('month', "closedAt")
    `,
  ]);

  return {
    kpis: {
      totalLeads,
      newLeads,
      totalContacts,
      totalAccounts,
      openDeals,
      wonDeals,
      lostDeals,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      pendingTasks,
      overdueTasks,
    },
    charts: {
      leadsByStatus,
      leadsBySource,
      dealsByStage,
      monthlyRevenue,
    },
    widgets: {
      recentLeads,
      recentContacts,
      upcomingActivities,
      overdueTasksList,
      recentDeals,
    },
  };
}
