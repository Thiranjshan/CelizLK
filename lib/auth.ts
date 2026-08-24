import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { jwtVerify, SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';

const accessSecret = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'celiz-development-access-secret-change-me'
);
export const refreshCookieName = 'celiz_refresh_token';

export const publicUser = (user: {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
}) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  phone: user.phone,
  role: user.role as 'CUSTOMER' | 'ADMIN',
});

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createAccessToken(user: { id: string; email: string; role: string }) {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(accessSecret);
}

export async function getUserFromRequest(request: Request) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, accessSecret);
    if (!payload.sub) return null;
    return prisma.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

export function hashRefreshToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function issueRefreshToken(userId: string, request: Request) {
  const rawToken = randomBytes(48).toString('base64url');
  const forwardedFor = request.headers.get('x-forwarded-for');
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(rawToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: request.headers.get('user-agent'),
      ip: forwardedFor?.split(',')[0].trim() || null,
    },
  });
  return rawToken;
}

export function refreshCookie(token: string) {
  return {
    name: refreshCookieName,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60,
  };
}