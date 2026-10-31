import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as authService from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { getCookieOptions } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import rateLimit from 'express-rate-limit';

// Strict rate limiting for login
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '10'),
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fullName, businessName, organizationName, email, phone, password } = req.body;
    const result = await authService.registerUser(
      { fullName, businessName: organizationName || businessName, email, phone, password },
      req.ip,
      req.headers['user-agent']
    );

    res.cookie('refreshToken', result.refreshToken, getCookieOptions());
    res.cookie('accessToken', result.accessToken, { ...getCookieOptions(), maxAge: 15 * 60 * 1000 });

    sendCreated(res, {
      user: result.user,
      organization: result.organization,
      accessToken: result.accessToken,
    }, 'Account created successfully');
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(
      { email, password },
      req.ip,
      req.headers['user-agent']
    );

    res.cookie('refreshToken', result.refreshToken, getCookieOptions());
    res.cookie('accessToken', result.accessToken, { ...getCookieOptions(), maxAge: 15 * 60 * 1000 });

    sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
    }, 'Logged in successfully');
  } catch (err) {
    next(err);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken || '';
    await authService.logoutUser(refreshToken);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw AppError.unauthorized('No refresh token provided');
    }

    const result = await authService.refreshSession(refreshToken, req.ip, req.headers['user-agent']);

    res.cookie('refreshToken', result.refreshToken, getCookieOptions());
    res.cookie('accessToken', result.accessToken, { ...getCookieOptions(), maxAge: 15 * 60 * 1000 });

    sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw AppError.unauthorized();
    const user = await authService.getMe(req.user.userId, req.user.organizationId || '');
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    await authService.requestPasswordReset(email);
    // Always return success to prevent email enumeration
    sendSuccess(res, null, 'If an account with that email exists, you will receive a password reset link shortly.');
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    sendSuccess(res, null, 'Password reset successfully. Please log in with your new password.');
  } catch (err) {
    next(err);
  }
}
