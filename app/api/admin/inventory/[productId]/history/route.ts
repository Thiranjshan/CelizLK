import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const productId = (await params).productId;
  const logs = await prisma.inventoryLog.findMany({ where: { productId }, orderBy: { createdAt: 'desc' }, take: 200, include: { adminUser: { select: { name: true, email: true } } } });
  return NextResponse.json(logs);
}