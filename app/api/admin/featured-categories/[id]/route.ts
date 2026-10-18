import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { resolveFeaturedCategoryOrderList } from '@/lib/featured-categories';
import { deleteUploadFileIfExists, getRemovedUploadUrls } from '@/lib/upload-storage';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['SUPER_ADMIN', 'PRODUCT_MANAGER', 'MARKETING'])) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.featuredCategory.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Featured category not found.' }, { status: 404 });
    }

    const body = await request.json();

    const nextCategoryId = typeof body.categoryId === 'string' && body.categoryId.trim() ? body.categoryId.trim() : existing.categoryId;
    if (nextCategoryId !== existing.categoryId) {
      const catExists = await prisma.category.findUnique({ where: { id: nextCategoryId } });
      if (!catExists) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });

      const duplicate = await prisma.featuredCategory.findUnique({ where: { categoryId: nextCategoryId } });
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: 'This category is already featured in another Bento slot.' }, { status: 409 });
      }
    }

    const nextImageUrl = body.imageUrl === '' ? null : typeof body.imageUrl === 'string' ? body.imageUrl.trim() : existing.imageUrl;
    const nextTitle = body.title === '' ? null : typeof body.title === 'string' ? body.title.trim() : existing.title;
    const nextDescription = body.description === '' ? null : typeof body.description === 'string' ? body.description.trim() : existing.description;
    const nextIsActive = typeof body.isActive === 'boolean' ? body.isActive : existing.isActive;

    // Clean up replaced uploaded image if any
    const removedImageUrls = getRemovedUploadUrls([existing.imageUrl], [nextImageUrl]);
    for (const imgUrl of removedImageUrls) {
      try {
        await deleteUploadFileIfExists(imgUrl);
      } catch (err) {
        console.warn('Failed to delete replaced upload file:', err);
      }
    }

    // Handle order
    const orderValue =
      body.order === null || body.order === undefined || body.order === ''
        ? existing.order
        : Number(body.order);

    if (!Number.isInteger(orderValue) || orderValue < 1) {
      return NextResponse.json({ error: 'Order must be a positive integer.' }, { status: 400 });
    }

    const existingEntries = await prisma.featuredCategory.findMany({
      where: { id: { not: id } },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });

    const reordered = resolveFeaturedCategoryOrderList(existingEntries, orderValue, id);

    const updated = await prisma.$transaction(async (tx) => {
      for (const item of existingEntries) {
        const next = reordered.find((entry) => entry.id === item.id);
        if (next && next.order !== item.order) {
          await tx.featuredCategory.update({
            where: { id: item.id },
            data: { order: next.order },
          });
        }
      }

      return await tx.featuredCategory.update({
        where: { id },
        data: {
          categoryId: nextCategoryId,
          imageUrl: nextImageUrl,
          title: nextTitle,
          description: nextDescription,
          isActive: nextIsActive,
          order: reordered.find((entry) => entry.id === id)?.order ?? existing.order,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
              description: true,
              _count: { select: { products: true } },
            },
          },
        },
      });
    });

    await writeAudit(admin.id, 'UPDATE', 'FEATURED_CATEGORY', id, {
      categoryName: updated.category.name,
      order: updated.order,
      isActive: updated.isActive,
      imageUrl: updated.imageUrl,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update featured category', error);
    return NextResponse.json({ error: 'Unable to update featured category.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['SUPER_ADMIN', 'PRODUCT_MANAGER', 'MARKETING'])) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.featuredCategory.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Featured category not found.' }, { status: 404 });
    }

    if (existing.imageUrl) {
      try {
        await deleteUploadFileIfExists(existing.imageUrl);
      } catch (err) {
        console.warn('Failed to delete upload file during remove:', err);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.featuredCategory.delete({ where: { id } });

      const remaining = await tx.featuredCategory.findMany({
        orderBy: { order: 'asc' },
        select: { id: true, order: true },
      });

      for (let i = 0; i < remaining.length; i++) {
        const item = remaining[i];
        if (item.order !== i + 1) {
          await tx.featuredCategory.update({
            where: { id: item.id },
            data: { order: i + 1 },
          });
        }
      }
    });

    await writeAudit(admin.id, 'DELETE', 'FEATURED_CATEGORY', id, {
      categoryId: existing.categoryId,
      categoryName: existing.category.name,
    });

    return NextResponse.json({ success: true, message: 'Removed from Bento Grid.' });
  } catch (error) {
    console.error('Failed to remove featured category', error);
    return NextResponse.json({ error: 'Unable to remove featured category.' }, { status: 500 });
  }
}
