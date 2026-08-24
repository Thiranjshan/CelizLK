import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request); if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } }, attributes: true, parent: true } }); return NextResponse.json(categories);
}
export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request); if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }); if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const body = await request.json(); const name = String(body.name || '').trim(); const slug = String(body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
  if (name.length < 2 || name.length > 80 || !slug) return NextResponse.json({ error: 'Valid name and slug are required.' }, { status: 400 });
  const attributes = Array.isArray(body.attributes) ? body.attributes.filter((attribute: { key?: unknown; label?: unknown; dataType?: unknown }) => typeof attribute.key === 'string' && typeof attribute.label === 'string' && ['text', 'number', 'boolean'].includes(String(attribute.dataType || 'text'))).slice(0, 30) : [];
  try { const category = await prisma.category.create({ data: { name, slug, description: typeof body.description === 'string' ? body.description.slice(0, 500) : null, attributes: { create: attributes.map((attribute: { key: string; label: string; dataType?: string; unit?: string; isComparable?: boolean }) => ({ attributeKey: attribute.key.slice(0, 60), attributeLabel: attribute.label.slice(0, 100), dataType: attribute.dataType || 'text', unit: attribute.unit?.slice(0, 20), isComparable: attribute.isComparable !== false })) } } }); await writeAudit(admin.id, 'CREATE', 'CATEGORY', category.id, { name, slug, attributes: attributes.length }); return NextResponse.json(category, { status: 201 }); } catch { return NextResponse.json({ error: 'Category name or slug already exists.' }, { status: 409 }); }
}