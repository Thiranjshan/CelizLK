import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { validateUploadedImage } from '@/lib/security';
import { deleteUploadFileIfExists, getRemovedUploadUrls } from '@/lib/upload-storage';

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    const categoryId = typeof form.get('categoryId') === 'string' ? String(form.get('categoryId')) : '';
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const validation = validateUploadedImage(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const category = categoryId
      ? await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true, imageUrl: true } })
      : null;
    if (categoryId && !category) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });

    const directory = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}${file.type === 'image/jpeg' ? '.jpg' : file.type === 'image/png' ? '.png' : '.webp'}`;
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
    const url = `/uploads/${filename}`;

    if (categoryId) {
      await prisma.category.update({ where: { id: categoryId }, data: { imageUrl: url } });
      const removedUrls = getRemovedUploadUrls([category?.imageUrl], [url]);
      for (const removedUrl of removedUrls) {
        await deleteUploadFileIfExists(removedUrl);
      }
      await writeAudit(admin.id, 'UPLOAD', 'CATEGORY_IMAGE', categoryId, { type: file.type, size: file.size, url });
    } else {
      await writeAudit(admin.id, 'UPLOAD', 'PRODUCT_IMAGE', filename, { type: file.type, size: file.size });
    }

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload product image', error);
    return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 });
  }
}