import { Router } from 'express';
import { Response, NextFunction, Request } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess } from '../utils/response';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, company, subject, message } = req.body;
    const submission = await prisma.contactFormSubmission.create({
      data: { name, email, phone, company, subject, message },
    });
    sendSuccess(res, submission, 'Thank you for contacting us! We will get back to you shortly.');
  } catch (err) { next(err); }
});

export default router;
