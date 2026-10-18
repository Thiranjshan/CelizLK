import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { resolveFeaturedCategoryOrderList } from '@/lib/featured-categories';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['SUPER_ADMIN', 'PRODUCT_MANAGER', 'MARKETING'])) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  try {
    const [featured, categories] = await Promise.all([
      prisma.featuredCategory.findMany({
        orderBy: { order: 'asc' },
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
      }),
      prisma.category.findMany({
        where: { parentId: null },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          description: true,
          _count: { select: { products: true } },
        },
      }),
    ]);

    return NextResponse.json({ items: featured, availableCategories: categories });
  } catch (error) {
    console.error('Failed to fetch featured categories', error);
    return NextResponse.json({ error: 'Unable to fetch featured categories.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['SUPER_ADMIN', 'PRODUCT_MANAGER', 'MARKETING'])) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const categoryId = typeof body.categoryId === 'string' ? body.categoryId.trim() : '';
    const imageUrl = typeof body.imageUrl === 'string' && body.imageUrl.trim() ? body.imageUrl.trim() : null;
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null;
    const description = typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null;
    const orderInput = body.order;
    const isActive = body.isActive !== false;

    if (!categoryId) {
      return NextResponse.json({ error: 'Please select a category.' }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true },
    });
    if (!category) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    const existingFeatured = await prisma.featuredCategory.findUnique({
      where: { categoryId },
    });
    if (existingFeatured) {
      return NextResponse.json({ error: 'This category is already featured in the Bento Grid.' }, { status: 409 });
    }

    const requestedOrder =
      orderInput === null || orderInput === undefined || orderInput === '' ? null : Number(orderInput);

    if (requestedOrder !== null && (!Number.isInteger(requestedOrder) || requestedOrder < 1)) {
      return NextResponse.json({ error: 'Order must be a positive integer.' }, { status: 400 });
    }

    const currentEntries = await prisma.featuredCategory.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });

    const resolved = resolveFeaturedCategoryOrderList(currentEntries, requestedOrder, null);

    const created = await prisma.$transaction(async (tx) => {
      const item = await tx.featuredCategory.create({
        data: {
          categoryId,
          imageUrl,
          title,
          description,
          order: resolved.find((e) => e.id === 'new')?.order ?? 1,
          isActive,
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

      for (const entry of resolved.filter((e) => e.id !== 'new')) {
        await tx.featuredCategory.update({
          where: { id: entry.id },
          data: { order: entry.order },
        });
      }

      return item;
    });

    await writeAudit(admin.id, 'CREATE', 'FEATURED_CATEGORY', created.id, {
      categoryId,
      categoryName: category.name,
      order: created.order,
      isActive,
      imageUrl,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create featured category', error);
    return NextResponse.json({ error: 'Unable to add category to Bento Grid.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['SUPER_ADMIN', 'PRODUCT_MANAGER'])) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  try {
    const count = await prisma.featuredCategory.count();
    await prisma.featuredCategory.deleteMany();

    await writeAudit(admin.id, 'DELETE', 'FEATURED_CATEGORY_ALL', 'all', {
      deletedCount: count,
    });

    return NextResponse.json({ success: true, message: `Cleared ${count} Bento Grid categories.` });
  } catch (error) {
    console.error('Failed to clear featured categories', error);
    return NextResponse.json({ error: 'Unable to clear Bento Grid categories.' }, { status: 500 });
  }
}
