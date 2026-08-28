import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' }, include: { category: true, brandRecord: true } });
  return NextResponse.json(products.map((product) => ({ ...product, images: JSON.parse(product.images), specs: JSON.parse(product.specs) })));
}

export async function PATCH(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const body = await request.json();
  const productId = typeof body.id === 'string' ? body.id : '';
  const data: {
    name?: string;
    slug?: string;
    description?: string;
    brandId?: string;
    categoryId?: string;
    price?: number;
    discountPrice?: number | null;
    stockQty?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    status?: string;
    images?: string;
    specs?: string;
  } = {};

  if (typeof body.name === 'string' && body.name.trim().length >= 2) {
    data.name = body.name.trim().slice(0, 160);
  }
  if (typeof body.slug === 'string' && body.slug.trim().length >= 2) {
    data.slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  } else if (data.name) {
    data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (typeof body.description === 'string' && body.description.trim().length >= 1) {
    data.description = body.description.trim().slice(0, 5000);
  }
  if (typeof body.brandId === 'string' && body.brandId.trim().length >= 1) {
    data.brandId = body.brandId.trim();
  }
  if (typeof body.categoryId === 'string' && body.categoryId.trim().length > 0) {
    data.categoryId = body.categoryId.trim();
  }
  if (Number.isFinite(body.price) && body.price >= 0) {
    data.price = Number(body.price);
  }
  if (body.discountPrice === null || (Number.isFinite(body.discountPrice) && body.discountPrice >= 0)) {
    data.discountPrice = body.discountPrice === null ? null : Number(body.discountPrice);
  }
  if (Number.isInteger(body.stockQty) && body.stockQty >= 0) {
    data.stockQty = body.stockQty;
  }
  if (typeof body.isActive === 'boolean') {
    data.isActive = body.isActive;
  }
  if (typeof body.isFeatured === 'boolean') {
    data.isFeatured = body.isFeatured;
  }
  if (typeof body.isNewArrival === 'boolean') {
    data.isNewArrival = body.isNewArrival;
  }
  if (body.status === 'ACTIVE' || body.status === 'DRAFT' || body.status === 'ARCHIVED') {
    data.status = body.status;
    if (body.isActive === undefined) {
      data.isActive = body.status === 'ACTIVE';
    }
  }
  if (Array.isArray(body.images)) {
    const validImages = body.images.filter(
      (img: unknown) => typeof img === 'string' && img.trim().length > 0 && (/^https?:\/\//.test(img) || img.startsWith('/') || img.startsWith('data:image/'))
    ).slice(0, 12);
    data.images = JSON.stringify(validImages);
  }
  if (body.specs && typeof body.specs === 'object' && !Array.isArray(body.specs)) {
    data.specs = JSON.stringify(body.specs);
  }

  if (!productId || !Object.keys(data).length) return NextResponse.json({ error: 'No valid product changes supplied.' }, { status: 400 });

  const current = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, price: true, discountPrice: true, stockQty: true, slug: true, brandId: true }
  });
  if (!current) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

  if (data.slug && data.slug !== current.slug) {
    const slugExists = await prisma.product.findFirst({
      where: { slug: data.slug, id: { not: productId } }
    });
    if (slugExists) {
      return NextResponse.json({ error: 'Product slug already exists.' }, { status: 409 });
    }
  }

  if (data.categoryId) {
    const categoryExists = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!categoryExists) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 400 });
    }
  }

  if (data.brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: data.brandId } });
    if (!brand) return NextResponse.json({ error: 'Brand not found.' }, { status: 400 });
    if (!brand.isActive && brand.id !== current.brandId) return NextResponse.json({ error: 'Inactive brands cannot be assigned to products.' }, { status: 400 });
  }

  const finalPrice = data.price ?? current.price;
  const finalDiscount = data.discountPrice === undefined ? current.discountPrice : data.discountPrice;
  if (finalDiscount !== null && finalDiscount !== undefined && finalDiscount > finalPrice) {
    return NextResponse.json({ error: 'Discount price cannot exceed the product price.' }, { status: 400 });
  }

  const product = await prisma.$transaction(async (transaction) => {
    if (data.stockQty !== undefined && data.stockQty !== current.stockQty) {
      const changed = await transaction.product.updateMany({ where: { id: productId, stockQty: current.stockQty }, data });
      if (changed.count !== 1) throw new Error('STOCK_CONFLICT');
      await transaction.inventoryLog.create({
        data: {
          productId,
          change: data.stockQty - current.stockQty,
          reason: typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim().slice(0, 200) : 'Admin stock adjustment',
          adminUserId: admin.id
        }
      });
      return transaction.product.findUniqueOrThrow({ where: { id: productId } });
    }
    return transaction.product.update({ where: { id: productId }, data });
  }).catch((error) => {
    if (error instanceof Error && error.message === 'STOCK_CONFLICT') return null;
    throw error;
  });

  if (!product) return NextResponse.json({ error: 'Stock changed by another request. Refresh and try again.' }, { status: 409 });

  await writeAudit(admin.id, 'UPDATE', 'PRODUCT', product.id, data);
  return NextResponse.json({
    ...product,
    images: JSON.parse(product.images),
    specs: JSON.parse(product.specs),
    brand: await prisma.brand.findUnique({ where: { id: product.brandId || '' } })
  });
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const body = await request.json();
  const name = String(body.name || '').trim();
  const slug = String(body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
  const price = Number(body.price);
  const stockQty = Number(body.stockQty ?? 0);
  const discountPrice = body.discountPrice === null || body.discountPrice === undefined ? null : Number(body.discountPrice);
  if (name.length < 2 || name.length > 160 || !slug || !Number.isFinite(price) || price < 0 || !Number.isInteger(stockQty) || stockQty < 0 || (discountPrice !== null && (!Number.isFinite(discountPrice) || discountPrice < 0 || discountPrice > price)) || typeof body.categoryId !== 'string' || typeof body.brandId !== 'string' || !body.description) return NextResponse.json({ error: 'Invalid product details.' }, { status: 400 });
  const brand = await prisma.brand.findUnique({ where: { id: body.brandId } });
  if (!brand) return NextResponse.json({ error: 'Selected brand does not exist.' }, { status: 400 });
  if (!brand.isActive) return NextResponse.json({ error: 'Inactive brands cannot be assigned to new products.' }, { status: 400 });
  try {
    const product = await prisma.product.create({ data: { name, slug, description: String(body.description).slice(0, 5000), price, discountPrice, stockQty, categoryId: body.categoryId, brandId: body.brandId, images: JSON.stringify(Array.isArray(body.images) ? body.images.slice(0, 12) : []), specs: JSON.stringify(body.specs && typeof body.specs === 'object' ? body.specs : {}), isFeatured: body.isFeatured === true, isNewArrival: body.isNewArrival === true, status: body.status === 'DRAFT' ? 'DRAFT' : 'ACTIVE' }, include: { brandRecord: true } });
    if (stockQty) await prisma.inventoryLog.create({ data: { productId: product.id, change: stockQty, reason: 'Initial stock', adminUserId: admin.id } });
    await writeAudit(admin.id, 'CREATE', 'PRODUCT', product.id, { name, slug, price, stockQty }); return NextResponse.json(product, { status: 201 });
  } catch { return NextResponse.json({ error: 'Product slug already exists or category is invalid.' }, { status: 409 }); }
}