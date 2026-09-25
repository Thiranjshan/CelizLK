import { NextResponse } from 'next/server';
import { createAccessToken, issueRefreshToken, publicUser, refreshCookie, userRateLimit, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

  if (!userRateLimit(`user-login:${ip}`)) {
    return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const genericError = NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  if (!user || !user.passwordHash) return genericError;
  if (user.lockUntil && user.lockUntil > new Date()) return genericError;
  if (!(await verifyPassword(password, user.passwordHash))) {
    const attempts = user.failedLoginAttempts + 1;
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: attempts, lockUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null } });
    return genericError;
  }
  const updatedUser = await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockUntil: null, lastLoginAt: new Date() } });
  const response = NextResponse.json({ user: publicUser(updatedUser), accessToken: await createAccessToken(updatedUser) });
  response.cookies.set(refreshCookie(await issueRefreshToken(updatedUser.id, request)));
  return response;
}