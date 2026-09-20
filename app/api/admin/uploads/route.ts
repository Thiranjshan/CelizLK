import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { validateUploadedImage } from '@/lib/security';

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    const validation = validateUploadedImage(file instanceof File ? file : new File([''], 'invalid'));

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const directory = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}${file.type === 'image/jpeg' ? '.jpg' : file.type === 'image/png' ? '.png' : '.webp'}`;
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
    const url = `/uploads/${filename}`;
    await writeAudit(admin.id, 'UPLOAD', 'PRODUCT_IMAGE', filename, { type: file.type, size: file.size });
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload product image', error);
    return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 });
  }
}