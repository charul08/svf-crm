import { z } from 'zod';

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const listLeadsSchema = z.object({
  query: paginationSchema.extend({
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED']).optional(),
    source: z.enum(['WEBSITE', 'SOCIAL_MEDIA', 'REFERRAL', 'ADVERTISEMENT', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'OTHER']).optional(),
    ownerId: z.string().uuid().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }),
});

export const createLeadSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    company: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    jobTitle: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    source: z.enum(['WEBSITE', 'SOCIAL_MEDIA', 'REFERRAL', 'ADVERTISEMENT', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'OTHER']).default('OTHER'),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED']).default('NEW'),
    rating: z.enum(['HOT', 'WARM', 'COLD']).optional(),
    industry: z.string().optional(),
    annualRevenue: z.number().positive().optional(),
    numberOfEmployees: z.number().int().positive().optional(),
    nextFollowUpDate: z.string().datetime().optional(),
    ownerId: z.string().uuid().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const updateLeadSchema = z.object({
  body: createLeadSchema.shape.body.partial(),
});

export const convertLeadSchema = z.object({
  body: z.object({
    createDeal: z.boolean().default(false),
    dealName: z.string().optional(),
    dealAmount: z.number().optional(),
    dealStage: z.enum(['QUALIFICATION', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
  }),
});
