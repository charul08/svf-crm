import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { logger } from '../utils/logger';

export interface RegisterInput {
  fullName: string;
  businessName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(input: RegisterInput, ipAddress?: string, userAgent?: string) {
  const { fullName, businessName, email, phone, password } = input;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw AppError.conflict('An account with this email address already exists');
  }

  // Hash password
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // Create organization slug
  const slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) + '-' + uuidv4().substring(0, 8);

  // Create user and organization in transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash,
        emailVerified: true, // Skip email verification in dev
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: businessName,
        slug,
      },
    });

    const membership = await tx.organizationMembership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: 'ORG_ADMIN',
      },
    });

    return { user, organization, membership };
  });

  logger.info(`New user registered: ${email}, org: ${businessName}`);

  // Create session tokens
  const accessToken = signAccessToken({
    userId: result.user.id,
    email: result.user.email,
    organizationId: result.organization.id,
    role: result.membership.role,
  });

  const refreshToken = signRefreshToken({
    userId: result.user.id,
    email: result.user.email,
    organizationId: result.organization.id,
    role: result.membership.role,
  });

  // Save session
  await prisma.session.create({
    data: {
      userId: result.user.id,
      refreshToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const { passwordHash: _, ...safeUser } = result.user;

  return {
    user: { ...safeUser, organizationId: result.organization.id, role: result.membership.role },
    organization: result.organization,
    accessToken,
    refreshToken,
  };
}

export async function loginUser(input: LoginInput, ipAddress?: string, userAgent?: string) {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        where: { isActive: true },
        include: { organization: true },
        take: 1,
      },
    },
  });

  if (!user || !user.isActive) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await argon2.verify(user.passwordHash, password);
  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const membership = user.memberships[0];
  if (!membership) {
    throw AppError.forbidden('No active organization membership found');
  }

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    organizationId: membership.organizationId,
    role: membership.role,
  });

  const refreshToken = signRefreshToken({
    userId: user.id,
    email: user.email,
    organizationId: membership.organizationId,
    role: membership.role,
  });

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const { passwordHash: _, ...safeUser } = user;

  return {
    user: {
      ...safeUser,
      memberships: undefined,
      organizationId: membership.organizationId,
      role: membership.role,
      organization: membership.organization,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshSession(token: string, ipAddress?: string, userAgent?: string) {
  const payload = verifyRefreshToken(token);

  // Find valid session
  const session = await prisma.session.findUnique({
    where: { refreshToken: token },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    throw AppError.unauthorized('Refresh token expired or invalid');
  }

  // Rotate tokens
  const newAccessToken = signAccessToken({
    userId: payload.userId,
    email: payload.email,
    organizationId: payload.organizationId,
    role: payload.role,
  });

  const newRefreshToken = signRefreshToken({
    userId: payload.userId,
    email: payload.email,
    organizationId: payload.organizationId,
    role: payload.role,
  });

  // Update session with new refresh token
  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshToken: newRefreshToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(refreshToken: string) {
  if (refreshToken) {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  
  // Always return success to prevent email enumeration
  if (!user) return;

  // Invalidate old tokens
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  const token = uuidv4();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  logger.info(`Password reset requested for: ${email}, token: ${token}`);
  // In production, send email with token
  // For dev, log the token
  if (process.env.NODE_ENV === 'development') {
    logger.info(`DEV: Password reset token for ${email}: ${token}`);
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken || resetToken.expiresAt < new Date() || resetToken.usedAt) {
    throw AppError.badRequest('Invalid or expired reset token');
  }

  const passwordHash = await argon2.hash(newPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate all sessions for security
    prisma.session.deleteMany({ where: { userId: resetToken.userId } }),
  ]);
}

export async function getMe(userId: string, organizationId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      memberships: {
        where: { organizationId, isActive: true },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              timezone: true,
              currency: true,
              dateFormat: true,
            },
          },
        },
      },
    },
  });

  if (!user) throw AppError.notFound('User not found');

  const membership = user.memberships[0];
  return {
    ...user,
    memberships: undefined,
    membership: membership || null,
    organizationId: membership?.organizationId,
    role: membership?.role,
    organization: membership?.organization,
  };
}
