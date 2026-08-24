import { NextRequest, NextResponse } from 'next/server';
import { adminRefreshCookie, adminRefreshCookieName, createAdminAccessToken, hashAdminRefreshToken, issueAdminRefreshToken, publicAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const raw = request.cookies.get(adminRefreshCookieName)?.value;
  if (!raw) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const stored = await prisma.adminRefreshToken.findUnique({ where: { tokenHash: hashAdminRefreshToken(raw) }, include: { adminUser: true } });
  if (!stored || stored.revoked || stored.expiresAt <= new Date() || !stored.adminUser.isActive) return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
  await prisma.adminRefreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  const response = NextResponse.json({ admin: publicAdmin(stored.adminUser), accessToken: await createAdminAccessToken(stored.adminUser) });
  response.cookies.set(adminRefreshCookie(await issueAdminRefreshToken(stored.adminUserId)));
  return response;
}