import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['SUPPORT_STAFF'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, email: true, fullName: true, phone: true, createdAt: true, _count: { select: { orders: true } } } });
  return NextResponse.json(customers);
}