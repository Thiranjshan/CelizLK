import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) { const admin = await getAdminFromRequest(request); if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }); if (!hasAdminPermission(admin.role, ['SUPER_ADMIN'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 }); const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { adminUser: { select: { name: true, email: true } } } }); return NextResponse.json(logs.map((log) => ({ ...log, changes: JSON.parse(log.changes) }))); }