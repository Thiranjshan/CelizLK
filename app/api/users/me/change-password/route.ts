import { NextResponse } from 'next/server';
import { getUserFromRequest, hashPassword, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const { currentPassword, newPassword } = await request.json();
  const stored = await prisma.user.findUnique({ where: { id: user.id } });
  if (!stored || !(await verifyPassword(String(currentPassword || ''), stored.passwordHash))) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } }),
    prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { revoked: true } }),
  ]);
  return NextResponse.json({ success: true });
}