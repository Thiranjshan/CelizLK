import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { normalizeCategoryImageUrl } from '@/lib/category-validation';
import { deleteUploadFileIfExists, getRemovedUploadUrls } from '@/lib/upload-storage';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const id = (await params).id;
  const body = await request.json();
  const data: {
    name?: string;
    description?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    imageUrl?: string | null;
  } = {};

  if (typeof body.name === 'string' && body.name.trim().length >= 2) {
    data.name = body.name.trim().slice(0, 80);
  }
  if (body.description === null || typeof body.description === 'string') {
    data.description = body.description?.slice(0, 500) || null;
  }
  if (body.seoTitle === null || typeof body.seoTitle === 'string') {
    data.seoTitle = body.seoTitle?.slice(0, 160) || null;
  }
  if (body.seoDescription === null || typeof body.seoDescription === 'string') {
    data.seoDescription = body.seoDescription?.slice(0, 320) || null;
  }
  if (Object.hasOwn(body, 'imageUrl')) {
    const imageUrl = normalizeCategoryImageUrl(body.imageUrl);
    if (imageUrl === undefined) {
      return NextResponse.json({ error: 'Enter a valid HTTP, HTTPS, or site-relative image URL.' }, { status: 400 });
    }
    data.imageUrl = imageUrl;
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: 'No valid changes supplied.' }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({
    where: { id },
    select: { imageUrl: true },
  });
  if (!existing) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });

  const nextImageUrl = Object.hasOwn(data, 'imageUrl') ? data.imageUrl : existing.imageUrl;
  const category = await prisma.category.update({ where: { id }, data });
  const removedUrls = getRemovedUploadUrls([existing.imageUrl], [nextImageUrl]);
  for (const url of removedUrls) {
    await deleteUploadFileIfExists(url);
  }
  await writeAudit(admin.id, 'UPDATE', 'CATEGORY', id, data);
  return NextResponse.json(category);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const id = (await params).id;
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count) return NextResponse.json({ error: 'Category still contains products.' }, { status: 409 });

  const category = await prisma.category.findUnique({
    where: { id },
    select: { imageUrl: true },
  });
  if (!category) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });

  await prisma.category.delete({ where: { id } });
  await deleteUploadFileIfExists(category.imageUrl);
  await writeAudit(admin.id, 'DELETE', 'CATEGORY', id, {});
  return NextResponse.json({ success: true });
}