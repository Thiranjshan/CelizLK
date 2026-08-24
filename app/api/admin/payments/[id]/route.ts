import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { const admin = await getAdminFromRequest(request); if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }); if (!hasAdminPermission(admin.role, ['ORDER_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 }); const payment = await prisma.payment.findUnique({ where: { id: (await params).id }, include: { order: true } }); if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 }); return NextResponse.json(payment); }