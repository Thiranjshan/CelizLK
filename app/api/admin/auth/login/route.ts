import { NextResponse } from 'next/server';
import { adminRateLimit, createAdminAccessToken, adminRefreshCookie, issueAdminRefreshToken, publicAdmin, verifyAdminPassword, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (!adminRateLimit(`admin-login:${ip}`)) return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
  const { email, password } = await request.json();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const admin = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
  const invalid = () => NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
  if (!admin || !admin.isActive || (admin.lockUntil && admin.lockUntil > new Date())) { await writeAudit(null, 'LOGIN_FAILED', 'ADMIN_USER', normalizedEmail, {}); return invalid(); }
  if (!(await verifyAdminPassword(String(password || ''), admin.passwordHash))) {
    const attempts = admin.failedLoginAttempts + 1;
    await prisma.adminUser.update({ where: { id: admin.id }, data: { failedLoginAttempts: attempts, lockUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null } });
    await writeAudit(admin.id, 'LOGIN_FAILED', 'ADMIN_USER', admin.id, {});
    return invalid();
  }
  const updated = await prisma.adminUser.update({ where: { id: admin.id }, data: { failedLoginAttempts: 0, lockUntil: null, lastLoginAt: new Date() } });
  await writeAudit(updated.id, 'LOGIN_SUCCESS', 'ADMIN_USER', updated.id, {});
  const response = NextResponse.json({ admin: publicAdmin(updated), accessToken: await createAdminAccessToken(updated) });
  response.cookies.set(adminRefreshCookie(await issueAdminRefreshToken(updated.id)));
  return response;
}