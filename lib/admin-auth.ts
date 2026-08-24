import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { jwtVerify, SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';

const configuredSecret = process.env.ADMIN_JWT_SECRET;
function getSecret() {
  if (process.env.NODE_ENV === 'production' && (!configuredSecret || configuredSecret.length < 32)) throw new Error('ADMIN_JWT_SECRET must be configured with at least 32 characters in production.');
  return new TextEncoder().encode(configuredSecret || 'celiz-development-admin-secret-change-me');
}
export const adminRefreshCookieName = 'celiz_admin_refresh_token';
export const adminRoles = ['SUPER_ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER', 'SUPPORT_STAFF', 'MARKETING'] as const;
export type AdminRole = typeof adminRoles[number];

const attempts = new Map<string, { count: number; resetAt: number }>();
export function adminRateLimit(key: string, limit = 10, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

export const publicAdmin = (admin: { id: string; email: string; name: string; role: string }) => ({
  id: admin.id, email: admin.email, name: admin.name, role: admin.role as AdminRole,
});

export const hashAdminPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyAdminPassword = (password: string, hash: string) => bcrypt.compare(password, hash);
export const hashAdminRefreshToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createAdminAccessToken(admin: { id: string; email: string; role: string }) {
  return new SignJWT({ email: admin.email, role: admin.role, kind: 'admin' })
    .setProtectedHeader({ alg: 'HS256' }).setSubject(admin.id).setIssuedAt().setExpirationTime('15m').sign(getSecret());
}

export async function getAdminFromRequest(request: Request) {
  const value = request.headers.get('authorization');
  const token = value?.startsWith('Bearer ') ? value.slice(7) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.kind !== 'admin' || !payload.sub) return null;
    const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    return admin?.isActive ? admin : null;
  } catch { return null; }
}

export async function issueAdminRefreshToken(adminUserId: string) {
  const raw = randomBytes(48).toString('base64url');
  await prisma.adminRefreshToken.create({ data: { adminUserId, tokenHash: hashAdminRefreshToken(raw), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  return raw;
}

export function adminRefreshCookie(token: string) {
  return { name: adminRefreshCookieName, value: token, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/api/admin/auth', maxAge: 7 * 24 * 60 * 60 };
}

export function hasAdminPermission(role: string, allowed: AdminRole[]) {
  return role === 'SUPER_ADMIN' || allowed.includes(role as AdminRole);
}

export async function writeAudit(adminUserId: string | null, action: string, entityType: string, entityId: string, changes: unknown = {}) {
  await prisma.auditLog.create({ data: { adminUserId, action, entityType, entityId, changes: JSON.stringify(changes) } });
}