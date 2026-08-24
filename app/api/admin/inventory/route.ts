import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const products = await prisma.product.findMany({ orderBy: { stockQty: 'asc' }, select: { id: true, name: true, stockQty: true, minStockAlert: true, isActive: true } });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const body = await request.json();
  const productId = typeof body.productId === 'string' ? body.productId : '';
  const change = Number(body.change);
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 200) : '';
  if (!productId || !Number.isInteger(change) || change === 0 || !reason) return NextResponse.json({ error: 'Product, integer stock change, and reason are required.' }, { status: 400 });
  const product = await prisma.$transaction(async (transaction) => {
    const current = await transaction.product.findUnique({ where: { id: productId }, select: { stockQty: true } });
    if (!current || current.stockQty + change < 0) throw new Error('INVALID_STOCK');
    const updated = await transaction.product.update({ where: { id: productId }, data: { stockQty: { increment: change } } });
    await transaction.inventoryLog.create({ data: { productId, change, reason, adminUserId: admin.id } });
    return updated;
  }).catch((error) => error instanceof Error && error.message === 'INVALID_STOCK' ? null : Promise.reject(error));
  if (!product) return NextResponse.json({ error: 'Stock cannot become negative or product does not exist.' }, { status: 400 });
  await writeAudit(admin.id, 'ADJUST_STOCK', 'PRODUCT', product.id, { change, reason });
  return NextResponse.json(product);
}