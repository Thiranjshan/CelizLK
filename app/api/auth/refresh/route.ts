import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken, hashRefreshToken, issueRefreshToken, publicUser, refreshCookie, refreshCookieName } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const rawToken = request.cookies.get(refreshCookieName)?.value;
  if (!rawToken) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(rawToken) }, include: { user: true } });
  if (!stored || stored.revoked || stored.expiresAt <= new Date()) return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  const response = NextResponse.json({ user: publicUser(stored.user), accessToken: await createAccessToken(stored.user) });
  response.cookies.set(refreshCookie(await issueRefreshToken(stored.userId, request)));
  return response;
}