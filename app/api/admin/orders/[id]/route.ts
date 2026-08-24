import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['ORDER_MANAGER', 'SUPPORT_STAFF'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      payment: true,
      events: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  return NextResponse.json({ ...order, payments: order.payment, shippingAddress: JSON.parse(order.shippingAddress) });
}
