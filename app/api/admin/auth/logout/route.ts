import { NextRequest, NextResponse } from 'next/server';
import { adminRefreshCookieName, getAdminFromRequest, hashAdminRefreshToken, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  const raw = request.cookies.get(adminRefreshCookieName)?.value;
  if (raw) await prisma.adminRefreshToken.updateMany({ where: { tokenHash: hashAdminRefreshToken(raw) }, data: { revoked: true } });
  if (admin) await writeAudit(admin.id, 'LOGOUT', 'ADMIN_USER', admin.id, {});
  const response = NextResponse.json({ success: true });
  response.cookies.set({ name: adminRefreshCookieName, value: '', httpOnly: true, expires: new Date(0), path: '/api/admin/auth' });
  return response;
}