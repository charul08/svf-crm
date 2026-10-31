import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: JwtPayload & {
    membershipId?: string;
    organizationId?: string;
    role?: UserRole;
  };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Check cookies
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw AppError.unauthorized('No authentication token provided');
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }

      const orgId = req.user.organizationId || req.params.orgId;
      if (!orgId) {
        throw AppError.forbidden('Organization context required');
      }

      const membership = await prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId: req.user.userId,
            organizationId: orgId,
          },
        },
      });

      if (!membership || !membership.isActive) {
        throw AppError.forbidden('You do not have access to this organization');
      }

      if (roles.length > 0 && !roles.includes(membership.role)) {
        throw AppError.forbidden('Insufficient permissions for this action');
      }

      req.user.membershipId = membership.id;
      req.user.organizationId = membership.organizationId;
      req.user.role = membership.role;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const payload = verifyAccessToken(token);
      req.user = payload;
    }

    next();
  } catch {
    next();
  }
}
