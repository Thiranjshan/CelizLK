import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request); if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } }, parent: true } }); return NextResponse.json(categories);
}
export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request); if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }); if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const body = await request.json(); const name = String(body.name || '').trim(); const slug = String(body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
  if (name.length < 2 || name.length > 80 || !slug) return NextResponse.json({ error: 'Valid name and slug are required.' }, { status: 400 });
  try { const category = await prisma.category.create({ data: { name, slug, description: typeof body.description === 'string' ? body.description.slice(0, 500) : null } }); await writeAudit(admin.id, 'CREATE', 'CATEGORY', category.id, { name, slug }); return NextResponse.json(category, { status: 201 }); } catch { return NextResponse.json({ error: 'Category name or slug already exists.' }, { status: 409 }); }
}