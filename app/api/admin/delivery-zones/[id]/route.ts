import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

async function admin(request: Request) {
  const current = await getAdminFromRequest(request);
  if (!current || !hasAdminPermission(current.role, ['ORDER_MANAGER'])) return null;
  return current;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await admin(request);
  if (!current) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const data: { name?: string; district?: string; fee?: number; isActive?: boolean } = {};
  if (body.name !== undefined) data.name = String(body.name).trim().slice(0, 100);
  if (body.district !== undefined) data.district = String(body.district).trim().slice(0, 100);
  if (body.fee !== undefined) { const fee = Number(body.fee); if (!Number.isFinite(fee) || fee < 0) return NextResponse.json({ error: 'Fee must be a non-negative number.' }, { status: 400 }); data.fee = fee; }
  if (body.isActive !== undefined) data.isActive = body.isActive === true;
  try { const zone = await prisma.deliveryZone.update({ where: { id }, data }); await writeAudit(current.id, 'UPDATE', 'DELIVERY_ZONE', id, data); return NextResponse.json(zone); } catch { return NextResponse.json({ error: 'Delivery zone not found or district already exists.' }, { status: 409 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await admin(request);
  if (!current) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const { id } = await params;
  try { await prisma.deliveryZone.delete({ where: { id } }); await writeAudit(current.id, 'DELETE', 'DELIVERY_ZONE', id, {}); return NextResponse.json({ success: true }); } catch { return NextResponse.json({ error: 'Delivery zone not found.' }, { status: 404 }); }
}
