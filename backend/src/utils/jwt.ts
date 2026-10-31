import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { AppError } from './AppError';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId?: string;
  role?: UserRole;
  sessionId?: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES as string,
    issuer: 'svf-crm',
    audience: 'svf-crm-client',
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES as string,
    issuer: 'svf-crm',
    audience: 'svf-crm-client',
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, ACCESS_SECRET, {
      issuer: 'svf-crm',
      audience: 'svf-crm-client',
    }) as JwtPayload;
  } catch {
    throw AppError.unauthorized('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, REFRESH_SECRET, {
      issuer: 'svf-crm',
      audience: 'svf-crm-client',
    }) as JwtPayload;
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }
}

export function getCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
    path: '/',
    maxAge: maxAge || 7 * 24 * 60 * 60 * 1000, // 7 days default
  };
}
