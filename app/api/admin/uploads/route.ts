import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';

const allowedTypes: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || !allowedTypes[file.type] || file.size === 0 || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Upload a JPEG, PNG, or WebP image smaller than 5MB.' }, { status: 400 });
  const directory = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}${allowedTypes[file.type]}`;
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  const url = `/uploads/${filename}`;
  await writeAudit(admin.id, 'UPLOAD', 'PRODUCT_IMAGE', filename, { type: file.type, size: file.size });
  return NextResponse.json({ url }, { status: 201 });
}