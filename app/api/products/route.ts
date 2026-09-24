import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const brandSlug = searchParams.get('brand');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const newArrivals = searchParams.get('newArrivals');
    const sort = searchParams.get('sort'); // price-asc, price-desc, newest

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (categorySlug) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    if (brandSlug) {
      const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
      if (brand) where.brandId = brand.id;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (newArrivals === 'true') {
      where.isNewArrival = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { brandRecord: { name: { contains: search } } },
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price-asc') orderBy = { price: 'asc' };
    if (sort === 'price-desc') orderBy = { price: 'desc' };

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: { category: true, brandRecord: true },
    });

    const formatted = products.map((p) => ({
      ...p,
      brand: p.brandRecord,
      images: JSON.parse(p.images),
      specs: p.specs,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, description, price, discountPrice, stockQty, categoryId, brandId, images, specs, isFeatured } = body;

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stockQty: parseInt(stockQty) || 10,
        categoryId,
        brandId,
        images: typeof images === 'string' ? images : JSON.stringify(images),
        specs: typeof specs === 'string' ? specs.slice(0, 10000) : '',
        isFeatured: Boolean(isFeatured),
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
