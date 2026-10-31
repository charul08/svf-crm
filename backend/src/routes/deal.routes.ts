import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getDeals, getPipeline, getDeal, createDeal, updateDeal, updateDealStage, deleteDeal } from '../controllers/deal.controller';

const router = Router();
router.use(authenticate);
router.get('/', getDeals);
router.get('/pipeline', getPipeline);
router.post('/', createDeal);
router.get('/:id', getDeal);
router.patch('/:id', updateDeal);
router.patch('/:id/stage', updateDealStage);
router.delete('/:id', deleteDeal);
export default router;
