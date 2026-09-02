import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { resolveHeroBannerOrderList } from '@/lib/hero-banners';

function normalizeLink(value: unknown) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || /^\/\//.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return '';
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['SUPER_ADMIN', 'PRODUCT_MANAGER', 'MARKETING'])) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const id = (await params).id;

  try {
    const existing = await prisma.heroBanner.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Banner not found.' }, { status: 404 });

    const body = await request.json();

    const nextImageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : existing.imageUrl;
    const nextButtonLabel =
      typeof body.buttonLabel === 'string' ? body.buttonLabel.trim() : existing.buttonLabel;
    const nextButtonLink = typeof body.buttonLink === 'string' ? normalizeLink(body.buttonLink) : existing.buttonLink;
    const nextIsActive = typeof body.isActive === 'boolean' ? body.isActive : existing.isActive;

    // Validate image URL
    if (!nextImageUrl || !/^\/?(?:\/|\.?\.\/|uploads\/|\/uploads\/).*\.(png|jpe?g|webp)(?:\?.*)?$/i.test(nextImageUrl)) {
      return NextResponse.json(
        { error: 'A valid image URL is required. Recommended banner ratio: 8:3 (1920×720 px).' },
        { status: 400 },
      );
    }

    // Validate button label
    if (nextButtonLabel.length < 2 || nextButtonLabel.length > 80) {
      return NextResponse.json({ error: 'Button label must be between 2 and 80 characters.' }, { status: 400 });
    }

    // Validate button link
    if (!nextButtonLink) {
      return NextResponse.json(
        { error: 'Button link is required and must be a valid internal or external URL.' },
        { status: 400 },
      );
    }

    // Handle order
    const orderValue = body.order === null || body.order === undefined || body.order === '' 
      ? existing.order 
      : Number(body.order);

    if (!Number.isInteger(orderValue) || orderValue < 1) {
      return NextResponse.json({ error: 'Order must be a positive integer.' }, { status: 400 });
    }

    // Get existing banners for reordering
    const existingOrderEntries = await prisma.heroBanner.findMany({
      where: { id: { not: id } },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });

    const reordered = resolveHeroBannerOrderList(existingOrderEntries, orderValue, id);

    // Update banner and reorder in a transaction
    const updated = await prisma.$transaction(async (transaction) => {
      // Update order for other banners
      for (const item of existingOrderEntries) {
        const next = reordered.find((entry) => entry.id === item.id);
        if (next && next.order !== item.order) {
          await transaction.heroBanner.update({ where: { id: item.id }, data: { order: next.order } });
        }
      }

      // Update the current banner
      const current = await transaction.heroBanner.update({
        where: { id },
        data: {
          imageUrl: nextImageUrl,
          buttonLabel: nextButtonLabel,
          buttonLink: nextButtonLink,
          isActive: nextIsActive,
          order: reordered.find((entry) => entry.id === id)?.order ?? existing.order,
        },
      });

      return current;
    });

    await writeAudit(admin.id, 'UPDATE', 'HERO_BANNER', id, {
      imageUrl: nextImageUrl,
      buttonLabel: nextButtonLabel,
      buttonLink: nextButtonLink,
      isActive: nextIsActive,
      order: updated.order,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update hero banner', error);
    return NextResponse.json({ error: 'Unable to update the hero banner.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['SUPER_ADMIN', 'PRODUCT_MANAGER', 'MARKETING'])) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const id = (await params).id;

  try {
    const banner = await prisma.heroBanner.findUnique({ where: { id } });
    if (!banner) return NextResponse.json({ error: 'Banner not found.' }, { status: 404 });

    // Delete and reindex order in a transaction
    await prisma.$transaction(async (transaction) => {
      // Get remaining banners
      const remaining = await transaction.heroBanner.findMany({
        where: { id: { not: id } },
        orderBy: { order: 'asc' },
      });

      // Reindex orders to eliminate gap
      for (const [index, item] of remaining.entries()) {
        if (item.order !== index + 1) {
          await transaction.heroBanner.update({ where: { id: item.id }, data: { order: index + 1 } });
        }
      }

      // Delete the banner
      await transaction.heroBanner.delete({ where: { id } });
    });

    await writeAudit(admin.id, 'DELETE', 'HERO_BANNER', id, { deletedOrder: banner.order });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete hero banner', error);
    return NextResponse.json({ error: 'Unable to delete the hero banner.' }, { status: 500 });
  }
}
