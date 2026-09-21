import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { ALLOWED_UPLOAD_MIME_TYPES, validateUploadedImage } from '@/lib/security';

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    const brandId = typeof form.get('brandId') === 'string' ? String(form.get('brandId')) : '';

    if (!brandId || !(file instanceof File)) {
      return NextResponse.json({ error: 'Brand and file are required.' }, { status: 400 });
    }

    const validation = validateUploadedImage(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { id: true, slug: true } });
    if (!brand) return NextResponse.json({ error: 'Brand not found.' }, { status: 404 });

    const extension = ALLOWED_UPLOAD_MIME_TYPES[file.type];
    const directory = path.join(process.cwd(), 'public', 'uploads', 'brands');
await mkdir(directory, { recursive: true });
const safeSlug = brand.slug.replace(/[^a-z0-9-]/gi, '');
const filename = `${safeSlug}-${Date.now()}${extension}`;
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
    const logoUrl = `/uploads/brands/${filename}`;
    await prisma.brand.update({ where: { id: brand.id }, data: { logoUrl } });
    await writeAudit(admin.id, 'UPLOAD', 'BRAND_LOGO', brand.id, { type: file.type, size: file.size, logoUrl });
    return NextResponse.json({ url: logoUrl }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload brand logo', error);
    return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 });
  }
}