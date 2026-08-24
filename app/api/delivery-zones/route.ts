import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const district = new URL(request.url).searchParams.get('district')?.trim();
  if (!district) return NextResponse.json({ error: 'District is required.' }, { status: 400 });
  const zone = await prisma.deliveryZone.findFirst({ where: { district: { equals: district }, isActive: true } });
  if (!zone) return NextResponse.json({ error: 'This delivery area is currently unavailable.' }, { status: 404 });
  return NextResponse.json({ id: zone.id, name: zone.name, district: zone.district, fee: zone.fee });
}
