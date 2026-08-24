import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER', 'ORDER_MANAGER', 'SUPPORT_STAFF', 'MARKETING'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [orders, products, customers, recentOrders, lowStock, bankTransferReviews] = await prisma.$transaction([
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, orderNumber: true, customerName: true, total: true, status: true, createdAt: true } }),
    prisma.product.findMany({ where: { isActive: true, stockQty: { lte: 5 } }, orderBy: { stockQty: 'asc' }, take: 8, select: { id: true, name: true, stockQty: true, price: true } }),
    prisma.order.count({ where: { paymentMethod: 'BANK_TRANSFER', status: 'AWAITING_PAYMENT', paymentStatus: 'PENDING', payment: { some: { transferSubmittedAt: { not: null } } } } }),
  ]);
  const todayOrders = orders.filter((order) => order.createdAt >= startOfDay);
  const revenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const statusCounts = orders.reduce<Record<string, number>>((counts, order) => { counts[order.status] = (counts[order.status] || 0) + 1; return counts; }, {});
  return NextResponse.json({ metrics: { todayRevenue: revenue, todayOrders: todayOrders.length, totalProducts: products, totalCustomers: customers, lowStock: lowStock.length, bankTransferReviews }, statusCounts, recentOrders, lowStock });
}