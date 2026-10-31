import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { listLeadsSchema, createLeadSchema, updateLeadSchema, convertLeadSchema } from '../validators/lead.validator';
import {
  getLeads, getLead, createLead, updateLead, deleteLead, convertLead,
} from '../controllers/lead.controller';

const router = Router();

router.use(authenticate);

router.get('/', validate(listLeadsSchema), getLeads);
router.post('/', validate(createLeadSchema), createLead);
router.get('/:id', getLead);
router.patch('/:id', validate(updateLeadSchema), updateLead);
router.delete('/:id', deleteLead);
router.post('/:id/convert', validate(convertLeadSchema), convertLead);

export default router;
