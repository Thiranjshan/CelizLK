import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

export const revalidate = 30;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const rawProduct = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, brandRecord: true },
  });

  if (!rawProduct) {
    notFound();
  }

  const product = {
    ...rawProduct,
    brand: rawProduct.brandRecord,
    images: JSON.parse(rawProduct.images),
    specs: JSON.parse(rawProduct.specs),
    createdAt: rawProduct.createdAt.toISOString(),
  };

  // Related products from same category
  const rawRelated = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    take: 4,
    include: { category: true, brandRecord: true },
  });

  const relatedProducts = rawRelated.map((p) => ({
    ...p,
    brand: p.brandRecord,
    images: JSON.parse(p.images),
    specs: JSON.parse(p.specs),
    createdAt: p.createdAt.toISOString(),
  }));

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
