import { NextResponse } from 'next/server';
import { getUserFromRequest, publicUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ user: publicUser(user), profile });
}

export async function PATCH(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const body = await request.json();
  const fullName = String(body.fullName || '').trim();
  const phone = body.phone ? String(body.phone).trim() : null;
  if (fullName.length < 2 || fullName.length > 100 || (phone && phone.length > 30)) return NextResponse.json({ error: 'Please provide valid profile details.' }, { status: 400 });
  const updated = await prisma.user.update({ where: { id: user.id }, data: { fullName, phone } });
  const profile = await prisma.profile.upsert({ where: { userId: user.id }, update: body.profile || {}, create: { userId: user.id, ...(body.profile || {}) } });
  return NextResponse.json({ user: publicUser(updated), profile });
}