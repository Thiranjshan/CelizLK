import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { ALLOWED_UPLOAD_MIME_TYPES, validateUploadedImage } from '@/lib/security';

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['SUPER_ADMIN', 'PRODUCT_MANAGER', 'MARKETING'])) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const validation = validateUploadedImage(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const directory = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(directory, { recursive: true });

    const extension = ALLOWED_UPLOAD_MIME_TYPES[file.type] || (file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg');
    const filename = `${randomUUID()}${extension}`;
    const filePath = path.join(directory, filename);

    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    const url = `/uploads/${filename}`;

    await writeAudit(admin.id, 'UPLOAD', 'FEATURED_CATEGORY_IMAGE', filename, {
      type: file.type,
      size: file.size,
      url,
    });

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload featured category image', error);
    return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 });
  }
}
