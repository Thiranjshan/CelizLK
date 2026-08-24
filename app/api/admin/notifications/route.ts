import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) { const admin = await getAdminFromRequest(request); if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }); return NextResponse.json((await prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })).map((notification) => ({ ...notification, payload: JSON.parse(notification.payload) }))); }