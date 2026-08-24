import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
  const body = await request.json();
  const data = { label: typeof body.label === 'string' ? body.label.trim().slice(0, 60) : existing.label, recipientName: typeof body.recipientName === 'string' ? body.recipientName.trim().slice(0, 100) : existing.recipientName, phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 30) : existing.phone, addressLine1: typeof body.addressLine1 === 'string' ? body.addressLine1.trim().slice(0, 200) : existing.addressLine1, addressLine2: typeof body.addressLine2 === 'string' ? body.addressLine2.trim().slice(0, 200) || null : existing.addressLine2, city: typeof body.city === 'string' ? body.city.trim().slice(0, 100) : existing.city, district: typeof body.district === 'string' ? body.district.trim().slice(0, 100) : existing.district, postalCode: typeof body.postalCode === 'string' ? body.postalCode.trim().slice(0, 20) || null : existing.postalCode };
  if (!data.label || !data.recipientName || !data.phone || !data.addressLine1 || !data.city || !data.district) return NextResponse.json({ error: 'Complete address details are required.' }, { status: 400 });
  const address = await prisma.$transaction(async (transaction) => {
    if (body.isDefault === true) await transaction.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    return transaction.address.update({ where: { id }, data: { ...data, ...(body.isDefault === true ? { isDefault: true } : {}) } });
  });
  return NextResponse.json(address);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const { id } = await params;
  const address = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!address) return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
  await prisma.address.delete({ where: { id } });
  if (address.isDefault) {
    const replacement = await prisma.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    if (replacement) await prisma.address.update({ where: { id: replacement.id }, data: { isDefault: true } });
  }
  return NextResponse.json({ success: true });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const { id } = await params;
  const address = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!address) return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
  await prisma.$transaction([prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }), prisma.address.update({ where: { id }, data: { isDefault: true } })]);
  return NextResponse.json({ ...address, isDefault: true });
}
