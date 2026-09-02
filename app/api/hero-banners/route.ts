import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const banners = await prisma.heroBanner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        imageUrl: true,
        buttonLabel: true,
        buttonLink: true,
      },
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error('Failed to fetch hero banners', error);
    return NextResponse.json({ error: 'Unable to fetch banners.' }, { status: 500 });
  }
}
