import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { resolveHeroBannerOrderList } from '@/lib/hero-banners';

function normalizeLink(value: unknown) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || /^\/\//.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return '';
}

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['SUPER_ADMIN', 'PRODUCT_MANAGER', 'MARKETING'])) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  try {
    const banners = await prisma.heroBanner.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error('Failed to fetch hero banners', error);
    return NextResponse.json({ error: 'Unable to fetch banners.' }, { status: 500 });
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
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    const buttonLabel = typeof body.buttonLabel === 'string' ? body.buttonLabel.trim() : '';
    const buttonLink = normalizeLink(body.buttonLink);
    const orderInput = body.order;
    const isActive = body.isActive !== false;

    // Validate image URL (must be a local path or valid image URL)
    if (!imageUrl || !/^\/?(?:\/|\.?\.\/|uploads\/|\/uploads\/).*\.(png|jpe?g|webp)(?:\?.*)?$/i.test(imageUrl)) {
      return NextResponse.json(
        { error: 'A valid image URL is required. Recommended banner ratio: 8:3 (1920×720 px).' },
        { status: 400 },
      );
    }

    // Validate button label
    if (buttonLabel.length < 2 || buttonLabel.length > 80) {
      return NextResponse.json({ error: 'Button label must be between 2 and 80 characters.' }, { status: 400 });
    }

    // Validate button link
    if (!buttonLink) {
      return NextResponse.json(
        { error: 'Button link is required and must be a valid internal or external URL.' },
        { status: 400 },
      );
    }

    // Validate order
    const requestedOrder =
      orderInput === null || orderInput === undefined || orderInput === '' ? null : Number(orderInput);

    if (requestedOrder !== null && (!Number.isInteger(requestedOrder) || requestedOrder < 1)) {
      return NextResponse.json({ error: 'Order must be a positive integer.' }, { status: 400 });
    }

    // Get existing banners for ordering
    const existing = await prisma.heroBanner.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });

    const resolved = resolveHeroBannerOrderList(existing, requestedOrder, null);

    // Create banner and update order in a transaction
    const created = await prisma.$transaction(async (transaction) => {
      const banner = await transaction.heroBanner.create({
        data: {
          imageUrl,
          buttonLabel,
          buttonLink,
          order: resolved.find((entry) => entry.id === 'new')?.order ?? 1,
          isActive,
        },
      });

      // Update order for existing banners if needed
      for (const entry of resolved.filter((item) => item.id !== 'new')) {
        await transaction.heroBanner.update({
          where: { id: entry.id },
          data: { order: entry.order },
        });
      }

      return banner;
    });

    await writeAudit(admin.id, 'CREATE', 'HERO_BANNER', created.id, {
      imageUrl,
      buttonLabel,
      buttonLink,
      isActive,
      order: created.order,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create hero banner', error);
    return NextResponse.json({ error: 'Unable to create the hero banner.' }, { status: 500 });
  }
}
