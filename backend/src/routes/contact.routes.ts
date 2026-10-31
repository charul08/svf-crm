import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getContacts, getContact, createContact, updateContact, deleteContact } from '../controllers/contact.controller';

const router = Router();
router.use(authenticate);
router.get('/', getContacts);
router.post('/', createContact);
router.get('/:id', getContact);
router.patch('/:id', updateContact);
router.delete('/:id', deleteContact);
export default router;
