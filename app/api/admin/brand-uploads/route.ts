import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

const allowedTypes: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const form = await request.formData();
  const file = form.get('file');
  const brandId = typeof form.get('brandId') === 'string' ? String(form.get('brandId')) : '';
  if (!brandId || !(file instanceof File) || !allowedTypes[file.type] || file.size === 0 || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Brand, and a JPEG, PNG, or WebP image smaller than 5MB are required.' }, { status: 400 });
  }
  const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { id: true, slug: true } });
  if (!brand) return NextResponse.json({ error: 'Brand not found.' }, { status: 404 });
  const extension = allowedTypes[file.type];
  const directory = path.join(process.cwd(), 'public', 'images', 'brands');
  await mkdir(directory, { recursive: true });
  const filename = `${brand.slug}${extension}`;
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  const logoUrl = `/images/brands/${filename}`;
  await prisma.brand.update({ where: { id: brand.id }, data: { logoUrl } });
  await writeAudit(admin.id, 'UPLOAD', 'BRAND_LOGO', brand.id, { type: file.type, size: file.size, logoUrl });
  return NextResponse.json({ url: logoUrl }, { status: 201 });
}