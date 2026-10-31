import { z } from 'zod';

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const listContactsSchema = z.object({
  query: paginationSchema.extend({
    accountId: z.string().uuid().optional(),
    ownerId: z.string().uuid().optional(),
  }),
});

export const createContactSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    accountId: z.string().uuid().optional(),
    ownerId: z.string().uuid().optional(),
    birthday: z.string().datetime().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
});

export const updateContactSchema = z.object({
  body: createContactSchema.shape.body.partial(),
});
