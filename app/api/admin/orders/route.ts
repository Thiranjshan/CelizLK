import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { orderStatuses, transitionOrder } from '@/lib/orders';
import type { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['ORDER_MANAGER', 'SUPPORT_STAFF'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const paymentMethod = params.get('paymentMethod');
  const paymentStatus = params.get('paymentStatus');
  const orderStatus = params.get('orderStatus');
  const search = params.get('search')?.trim();
  const where: Prisma.OrderWhereInput = {
    ...(paymentMethod ? { payment: { some: { method: paymentMethod } } } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(orderStatus ? { status: orderStatus } : {}),
    ...(search ? { OR: [{ orderNumber: { contains: search } }, { customerName: { contains: search } }, { customerEmail: { contains: search } }, { customerPhone: { contains: search } }, { payment: { some: { transferReference: { contains: search } } } }] } : {}),
  };
  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100, include: { items: { include: { product: true } }, payment: true, events: { orderBy: { createdAt: 'asc' } } } });
  return NextResponse.json(orders.map((order) => ({ ...order, payments: order.payment, shippingAddress: JSON.parse(order.shippingAddress) })));
}

export async function PATCH(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['ORDER_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const body = await request.json();
  if (typeof body.id !== 'string' || !orderStatuses.includes(body.status)) return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
  try {
    const order = await transitionOrder(body.id, body.status, admin.id);
    console.info(`Order status transition - Order: ${order.orderNumber}, Admin: ${admin.id}, New status: ${body.status}`);
    await writeAudit(admin.id, 'UPDATE_STATUS', 'ORDER', order.id, { status: body.status });
    return NextResponse.json(order);
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const messages: Record<string, string> = { ORDER_NOT_FOUND: 'Order not found.', INVALID_ORDER_TRANSITION: 'That order status transition is not allowed.', PAYMENT_REQUIRED: 'Payment must be confirmed before processing this order.', ORDER_CONFLICT: 'Order changed by another admin. Refresh and try again.' };
    return NextResponse.json({ error: messages[code] || 'Unable to update order status.' }, { status: code === 'ORDER_NOT_FOUND' ? 404 : 409 });
  }
}