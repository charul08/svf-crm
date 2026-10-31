import { Router, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import {
  register,
  login,
  logout,
  refresh,
  me,
  forgotPassword,
  resetPassword,
  loginRateLimiter,
} from '../controllers/auth.controller';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';
import { prisma } from '../lib/prisma';
import { sendSuccess } from '../utils/response';
import argon2 from 'argon2';
import { AppError } from '../utils/AppError';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', loginRateLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authenticate, me);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Profile update
router.patch('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fullName, phone, avatarUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(fullName && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(avatarUrl && { avatarUrl }),
      },
      select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
    });
    sendSuccess(res, user, 'Profile updated');
  } catch (err) { next(err); }
});

// Change password
router.patch('/change-password', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw AppError.badRequest('Both passwords are required');
    if (newPassword.length < 8) throw AppError.badRequest('New password must be at least 8 characters');

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw AppError.notFound('User not found');

    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) throw AppError.unauthorized('Current password is incorrect');

    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    sendSuccess(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
});

export default router;
