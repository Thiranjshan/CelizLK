import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { isValidProductSlug, normalizeProductImages, normalizeProductSlug, PRODUCT_DESCRIPTION_MAX_LENGTH, PRODUCT_NAME_MAX_LENGTH, PRODUCT_SPECS_MAX_LENGTH } from '@/lib/product-validation';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' }, include: { category: true, brandRecord: true } });
  return NextResponse.json(products.map((product) => ({ ...product, images: JSON.parse(product.images), specs: product.specs })));
}

export async function PATCH(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const body = await request.json();
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid product details.' }, { status: 400 });
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

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > PRODUCT_NAME_MAX_LENGTH) {
      return NextResponse.json({ error: 'Product name must be between 2 and 160 characters.' }, { status: 400 });
    }
    data.name = body.name.trim();
  }
  if (body.slug !== undefined && (typeof body.slug !== 'string' || (body.slug.trim() && !isValidProductSlug(normalizeProductSlug(body.slug))))) {
    return NextResponse.json({ error: 'Slug must contain only lowercase letters, numbers, and hyphens.' }, { status: 400 });
  }
  if (typeof body.slug === 'string' && body.slug.trim()) {
    data.slug = normalizeProductSlug(body.slug);
  } else if (data.name) {
    data.slug = normalizeProductSlug(data.name);
  }
  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || body.description.trim().length < 1 || body.description.length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
      return NextResponse.json({ error: 'Description must be between 1 and 5000 characters.' }, { status: 400 });
    }
    data.description = body.description.trim();
  }
  if (body.brandId !== undefined) {
    if (typeof body.brandId !== 'string' || !body.brandId.trim()) {
      return NextResponse.json({ error: 'A valid brand is required.' }, { status: 400 });
    }
    data.brandId = body.brandId.trim();
  }
  if (body.categoryId !== undefined) {
    if (typeof body.categoryId !== 'string' || !body.categoryId.trim()) {
      return NextResponse.json({ error: 'A valid category is required.' }, { status: 400 });
    }
    data.categoryId = body.categoryId.trim();
  }
  if (body.price !== undefined && (!Number.isFinite(body.price) || body.price < 0)) {
    return NextResponse.json({ error: 'Price must be a valid non-negative number.' }, { status: 400 });
  }
  if (body.price !== undefined) {
    data.price = Number(body.price);
  }
  if (body.discountPrice !== undefined && body.discountPrice !== null && (!Number.isFinite(body.discountPrice) || body.discountPrice < 0)) {
    return NextResponse.json({ error: 'Discount price must be a valid non-negative number.' }, { status: 400 });
  }
  if (body.discountPrice === null || (Number.isFinite(body.discountPrice) && body.discountPrice >= 0)) {
    data.discountPrice = body.discountPrice === null ? null : Number(body.discountPrice);
  }
  if (body.stockQty !== undefined && (!Number.isInteger(body.stockQty) || body.stockQty < 0)) {
    return NextResponse.json({ error: 'Stock quantity must be a non-negative integer.' }, { status: 400 });
  }
  if (body.stockQty !== undefined) {
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
    data.images = JSON.stringify(normalizeProductImages(body.images));
  } else if (body.images !== undefined) {
    return NextResponse.json({ error: 'Images must be an array of valid image URLs.' }, { status: 400 });
  }
  if (body.specs !== undefined) {
    if (typeof body.specs !== 'string' || body.specs.length > PRODUCT_SPECS_MAX_LENGTH) {
      return NextResponse.json({ error: 'Technical specifications cannot exceed 10000 characters.' }, { status: 400 });
    }
    data.specs = body.specs;
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
    specs: product.specs,
    brand: await prisma.brand.findUnique({ where: { id: product.brandId || '' } })
  });
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['PRODUCT_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const body = await request.json();
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid product details.' }, { status: 400 });
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const slug = normalizeProductSlug(typeof body.slug === 'string' && body.slug.trim() ? body.slug : name);
  const price = body.price;
  const stockQty = body.stockQty ?? 0;
  const discountPrice = body.discountPrice === null || body.discountPrice === undefined ? null : body.discountPrice;
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const categoryId = typeof body.categoryId === 'string' ? body.categoryId.trim() : '';
  const brandId = typeof body.brandId === 'string' ? body.brandId.trim() : '';
  if (name.length < 2 || name.length > PRODUCT_NAME_MAX_LENGTH || !isValidProductSlug(slug) || typeof price !== 'number' || !Number.isFinite(price) || price < 0 || typeof stockQty !== 'number' || !Number.isInteger(stockQty) || stockQty < 0 || (discountPrice !== null && (typeof discountPrice !== 'number' || !Number.isFinite(discountPrice) || discountPrice < 0 || discountPrice > price)) || description.length < 10 || description.length > PRODUCT_DESCRIPTION_MAX_LENGTH || !categoryId || !brandId || (typeof body.specs !== 'undefined' && (typeof body.specs !== 'string' || body.specs.length > PRODUCT_SPECS_MAX_LENGTH))) return NextResponse.json({ error: 'Invalid product details.' }, { status: 400 });
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) return NextResponse.json({ error: 'Selected brand does not exist.' }, { status: 400 });
  if (!brand.isActive) return NextResponse.json({ error: 'Inactive brands cannot be assigned to new products.' }, { status: 400 });
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return NextResponse.json({ error: 'Selected category does not exist.' }, { status: 400 });
  const status = body.status === 'DRAFT' || body.status === 'ARCHIVED' ? body.status : body.status === 'ACTIVE' || body.status === undefined ? 'ACTIVE' : null;
  if (!status) return NextResponse.json({ error: 'Invalid product status.' }, { status: 400 });
  let product;
  try {
    product = await prisma.product.create({ data: { name, slug, description, price, discountPrice, stockQty, categoryId, brandId, images: JSON.stringify(normalizeProductImages(body.images)), specs: typeof body.specs === 'string' ? body.specs : '', isFeatured: body.isFeatured === true, isNewArrival: body.isNewArrival === true, status, isActive: status === 'ACTIVE' }, include: { brandRecord: true } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Product slug already exists.' }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json({ error: 'Selected category or brand does not exist.' }, { status: 400 });
    }
    console.error('Failed to create product', error);
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
  if (stockQty) await prisma.inventoryLog.create({ data: { productId: product.id, change: stockQty, reason: 'Initial stock', adminUserId: admin.id } });
  await writeAudit(admin.id, 'CREATE', 'PRODUCT', product.id, { name, slug, price, stockQty });
  return NextResponse.json(product, { status: 201 });
}