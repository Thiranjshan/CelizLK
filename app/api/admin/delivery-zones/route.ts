import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['ORDER_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  return NextResponse.json(await prisma.deliveryZone.findMany({ orderBy: { district: 'asc' } }));
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['ORDER_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const body = await request.json();
  const name = String(body.name || '').trim().slice(0, 100);
  const district = String(body.district || '').trim().slice(0, 100);
  const fee = Number(body.fee);
  if (!name || !district || !Number.isFinite(fee) || fee < 0) return NextResponse.json({ error: 'Valid zone name, district, and fee are required.' }, { status: 400 });
  try {
    const zone = await prisma.deliveryZone.create({ data: { name, district, fee, isActive: body.isActive !== false } });
    await writeAudit(admin.id, 'CREATE', 'DELIVERY_ZONE', zone.id, { name, district, fee });
    return NextResponse.json(zone, { status: 201 });
  } catch { return NextResponse.json({ error: 'A delivery zone for this district already exists.' }, { status: 409 }); }
}
