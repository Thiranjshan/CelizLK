import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

const statuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const transitions: Record<string, string[]> = { PENDING: ['PAID', 'CANCELLED'], PAID: ['SHIPPED', 'CANCELLED'], SHIPPED: ['DELIVERED'], DELIVERED: [], CANCELLED: [] };

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['ORDER_MANAGER', 'SUPPORT_STAFF'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { items: { include: { product: true } } } });
  return NextResponse.json(orders.map((order) => ({ ...order, shippingAddress: JSON.parse(order.shippingAddress) })));
}

export async function PATCH(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['ORDER_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const body = await request.json();
  if (typeof body.id !== 'string' || !statuses.includes(body.status)) return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
  const current = await prisma.order.findUnique({ where: { id: body.id }, select: { status: true } });
  if (!current) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  if (!transitions[current.status]?.includes(body.status)) return NextResponse.json({ error: `Cannot move order from ${current.status} to ${body.status}.` }, { status: 409 });
  const order = await prisma.order.update({ where: { id: body.id }, data: { status: body.status } });
  await writeAudit(admin.id, 'UPDATE_STATUS', 'ORDER', order.id, { status: body.status });
  return NextResponse.json(order);
}