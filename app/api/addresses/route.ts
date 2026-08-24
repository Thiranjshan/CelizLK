import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function addressData(body: Record<string, unknown>) {
  const label = String(body.label || 'Home').trim().slice(0, 60);
  const recipientName = String(body.recipientName || '').trim().slice(0, 100);
  const phone = String(body.phone || '').trim().slice(0, 30);
  const addressLine1 = String(body.addressLine1 || '').trim().slice(0, 200);
  const city = String(body.city || '').trim().slice(0, 100);
  const district = String(body.district || '').trim().slice(0, 100);
  if (!label || !recipientName || !phone || !addressLine1 || !city || !district) throw new Error('INVALID_ADDRESS');
  return { label, recipientName, phone, addressLine1, addressLine2: typeof body.addressLine2 === 'string' ? body.addressLine2.trim().slice(0, 200) || null : null, city, district, postalCode: typeof body.postalCode === 'string' ? body.postalCode.trim().slice(0, 20) || null : null };
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  return NextResponse.json(await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] }));
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  try {
    const body = await request.json();
    const data = addressData(body);
    const isFirst = (await prisma.address.count({ where: { userId: user.id } })) === 0;
    const address = await prisma.$transaction(async (transaction) => {
      if (body.isDefault === true || isFirst) await transaction.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      return transaction.address.create({ data: { ...data, userId: user.id, isDefault: body.isDefault === true || isFirst } });
    });
    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === 'INVALID_ADDRESS' ? 'Complete address details are required.' : 'Unable to save address.' }, { status: 400 });
  }
}
