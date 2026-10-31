import { z } from 'zod';

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const listDealsSchema = z.object({
  query: paginationSchema.extend({
    stage: z.enum(['QUALIFICATION', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
    ownerId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    contactId: z.string().uuid().optional(),
  }),
});

export const createDealSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Deal name is required').max(200),
    contactId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    ownerId: z.string().uuid().optional(),
    amount: z.number().min(0).default(0),
    currency: z.string().default('INR'),
    stage: z.enum(['QUALIFICATION', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).default('QUALIFICATION'),
    probability: z.number().min(0).max(100).default(10),
    expectedCloseDate: z.string().datetime().optional(),
    source: z.enum(['WEBSITE', 'SOCIAL_MEDIA', 'REFERRAL', 'ADVERTISEMENT', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'OTHER']).default('OTHER'),
    description: z.string().optional(),
    nextStep: z.string().optional(),
  }),
});

export const updateDealSchema = z.object({
  body: createDealSchema.shape.body.partial(),
});

export const updateDealStageSchema = z.object({
  body: z.object({
    stage: z.enum(['QUALIFICATION', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']),
    probability: z.number().min(0).max(100).optional(),
    winReason: z.string().optional(),
    lossReason: z.string().optional(),
    note: z.string().optional(),
  }),
});
